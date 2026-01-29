const { google } = require('googleapis');
const path = require('path');

// Configure Auth using GoogleAuth (works more reliably)
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// Create auth configuration based on environment
// In production (Render), use GOOGLE_CREDENTIALS env var
// In development, use credentials.json file
let authConfig;

if (process.env.GOOGLE_CREDENTIALS) {
    // Production: parse credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    authConfig = {
        credentials: credentials,
        scopes: SCOPES,
    };
} else {
    // Development: use credentials.json file
    authConfig = {
        keyFile: path.join(__dirname, '..', 'credentials.json'),
        scopes: SCOPES,
    };
}

const auth = new google.auth.GoogleAuth(authConfig);

// Pricing based on duration
const PRICING = {
    60: 55,   // 1 hour = 55€
    90: 80,   // 1.5 hours = 80€
};

/**
 * Calculate price based on session duration in minutes
 */
const calculatePrice = (durationMinutes) => {
    if (durationMinutes <= 60) return PRICING[60];
    if (durationMinutes <= 90) return PRICING[90];
    // For longer sessions, use 90min rate
    return PRICING[90];
};

/**
 * Get weeks of a given month
 */
const getWeeksOfMonth = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Find first Monday of the week containing the 1st
    let currentDate = new Date(firstDay);
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + diff);

    let weekNumber = 1;
    while (currentDate <= lastDay || currentDate.getMonth() === month) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        weeks.push({
            weekNumber,
            start: weekStart,
            end: weekEnd,
            label: `${weekStart.getDate()}-${weekEnd.getDate()} ${getMonthName(weekEnd.getMonth())}`
        });

        currentDate.setDate(currentDate.getDate() + 7);
        weekNumber++;

        // Stop if we've gone past the month
        if (weekStart.getMonth() > month && weekStart.getFullYear() >= year) break;
        if (weekNumber > 6) break; // Safety limit
    }

    return weeks;
};

const getMonthName = (monthIndex) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[monthIndex];
};

// Google Calendar Colors (ID -> Hex)
const GOOGLE_COLORS = {
    '1': '#7986cb', // Lavender (Miriam)
    '2': '#33b679', // Sage (Lucía)
    '3': '#8e24aa', // Grape (Cèlia)
    '4': '#e67c73', // Flamingo (Sonia, Patri, Mariana)
    '5': '#f6c026', // Banana (Sara)
    '6': '#f4511e', // Tangerine (Eli)
    '7': '#039be5', // Peacock (Yaiza)
    '8': '#616161', // Graphite (Mónica)
    '9': '#3f51b5', // Blueberry (Joan)
    '10': '#0b8043', // Basil (Christian)
    '11': '#d50000', // Tomato (Anna)
};

// Legacy/Manual aliases that can't be easily inferred
const MANUAL_ALIASES = {
    'chris': 'Christian Ayuste',
    'moni': 'Mónica Vidal',
    'patri': 'Patri', // If 'Patri' is not the full name in DB
    'eli': 'Elisabet Vidal',
};

const pool = require('../config/db');

/**
 * Fetch therapists from DB and build a detection map
 * Returns: { 'slug': {id, name, colorId, color}, ... }
 */
const getTherapistMap = async () => {
    try {
        const result = await pool.query('SELECT id, full_name, calendar_color_id, calendar_alias FROM therapists WHERE is_active = true OR id IN (SELECT therapist_id FROM users)');
        const map = {};

        // Helper to add entry
        const addEntry = (key, therapist) => {
            const normalizedKey = normalizeText(key);
            if (!normalizedKey) return;

            map[normalizedKey] = {
                id: therapist.id,
                name: therapist.full_name,
                colorId: String(therapist.calendar_color_id || '8'), // Default to graphite
                color: GOOGLE_COLORS[String(therapist.calendar_color_id)] || '#616161'
            };
        };

        result.rows.forEach(t => {
            // 0. Primary Alias (User defined) - Highest priority (override others if needed)
            if (t.calendar_alias) {
                addEntry(t.calendar_alias, t);
            }

            // 1. Full name
            addEntry(t.full_name, t);

            // 2. First name (e.g., "Mariana")
            const firstName = t.full_name.split(' ')[0];
            if (firstName.length > 2) {
                addEntry(firstName, t);
            }

            // 3. Manual aliases support
            // Reverse lookup: check if this therapist matches any manual alias target
            Object.entries(MANUAL_ALIASES).forEach(([alias, targetName]) => {
                if (normalizeText(t.full_name) === normalizeText(targetName) ||
                    t.full_name.includes(targetName)) {
                    addEntry(alias, t);
                }
            });
        });

        // Add explicit 'patri' if not mapped (legacy fallback)
        if (!map['patri']) {
            // If Patri exists in DB she will be added above. If not, maybe keep fallback?
            // Let's assume she is in DB or this fallback is needed only if she's not.
            // map['patri'] = { id: 6, name: 'Patri', colorId: '4', color: '#e67c73' };
        }

        return map;
    } catch (error) {
        console.error('Error building therapist map:', error);
        return {}; // Return empty map on error to avoid crashes, will result in "Sin asignar"
    }
};


/**
 * Normalize text by removing accents for comparison
 */
const normalizeText = (text) => {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};

/**
 * Detect therapist from event title using /nombre/ format or plain name
 * Requires a therapistMap (built from DB). If not provided, returns unknown.
 */
const detectTherapist = (title, therapistMap = {}) => {
    const normalizedTitle = normalizeText(title);

    // Priority 1: Extract text between slashes: /nombre/
    const match = title.match(/\/([^/]+)\//);

    if (match) {
        const therapistTag = match[1].toLowerCase().trim();
        const normalizedTag = normalizeText(match[1]);

        // Try exact match or normalized match in map
        if (therapistMap[normalizedTag]) {
            return therapistMap[normalizedTag];
        }

        // Try searching keys that contain the tag (partial match for tag?)
        // Usually tags are exact: /mariana/ -> matches 'mariana' key
    }

    // Priority 2: Search for therapist keys anywhere in the title
    // Sort keys by length descending to match "Maria Jose" before "Maria"
    const keys = Object.keys(therapistMap).sort((a, b) => b.length - a.length);

    for (const key of keys) {
        // Skip very short keys to avoid false positives (e.g. "a", "el")
        if (key.length < 3) continue;

        // Create a pattern that matches the key as a separate word
        // \b matches word boundaries
        const pattern = new RegExp(`\\b${key}\\b`, 'i');
        if (pattern.test(normalizedTitle)) {
            return therapistMap[key];
        }
    }

    // No therapist detected
    return { id: null, name: 'Sin asignar', colorId: 'default', color: '#e0e0e0' };
};

/**
 * Get individual sessions for a date range
 * Now fetches therapist map dynamically
 */
const getSessions = async (calendarId, startDate, endDate, colorId = null) => {
    try {
        const [authClient, eventsList, therapistMap] = await Promise.all([
            auth.getClient(),
            // We'll fetch events in the next step, just getting deps here
            Promise.resolve(null),
            getTherapistMap()
        ]);

        const calendar = google.calendar({ version: 'v3', auth: authClient });

        const response = await calendar.events.list({
            calendarId,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 500,
        });

        const events = response.data.items || [];
        const sessions = [];

        events.forEach(event => {
            // Skip all-day events
            if (!event.start.dateTime || !event.end.dateTime) return;

            const title = event.summary || '';
            const lowerTitle = title.toLowerCase();

            // Check if it's a non-billable event (free room slot or cancelled session)
            const isLibre = lowerTitle.includes('libre');
            const isAnulada = lowerTitle.includes('anulada');
            const isNoDisponible = lowerTitle.includes('no disponible');
            const isNonBillable = isLibre || isAnulada || isNoDisponible;

            // Skip Anna's sessions - she's the manager, billed separately
            if (title.toLowerCase().includes('anna')) return;

            const eventColorId = event.colorId || 'default';

            // Filter by color if specified
            if (colorId !== null && eventColorId !== String(colorId)) return;

            const startTime = new Date(event.start.dateTime);
            const endTime = new Date(event.end.dateTime);
            const durationMinutes = (endTime - startTime) / (1000 * 60);

            // Non-billable events (libre/anulada) have 0 price
            const price = isNonBillable ? 0 : calculatePrice(durationMinutes);

            // Detect therapist from title using dynamic map
            const therapist = detectTherapist(event.summary || '', therapistMap);

            sessions.push({
                id: event.id,
                title: event.summary || 'Sin título',
                date: startTime.toISOString().split('T')[0],
                startTime: startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                endTime: endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                durationMinutes,
                price,
                isLibre: isNonBillable, // Flag for UI (libre or anulada)
                colorId: therapist.colorId,
                therapistId: therapist.id,
                therapistName: therapist.name,
                therapistColor: therapist.color,
                dayOfWeek: startTime.toLocaleDateString('es-ES', { weekday: 'long' }),
            });
        });

        return sessions;

    } catch (error) {
        console.error('Error fetching calendar sessions:', error);
        throw error;
    }
};

/**
 * Get sessions grouped by therapist for a week
 */
const getWeeklySummary = async (calendarId, startDate, endDate, therapists) => {
    // getSessions handles the map loading internally
    const sessions = await getSessions(calendarId, startDate, endDate);

    // Group sessions by therapist (using therapistId/therapistName from /nombre/ detection)
    const byTherapist = {};
    let totalSessions = 0;
    let totalAmount = 0;

    sessions.forEach(session => {
        const key = session.therapistId || 'unassigned';

        if (!byTherapist[key]) {
            byTherapist[key] = {
                therapistId: session.therapistId,
                therapistName: session.therapistName,
                colorId: session.colorId,
                color: session.therapistColor,
                sessions: [],
                totalSessions: 0,
                totalMinutes: 0,
                totalAmount: 0,
            };
        }

        byTherapist[key].sessions.push(session);
        byTherapist[key].totalSessions++;
        byTherapist[key].totalMinutes += session.durationMinutes;
        byTherapist[key].totalAmount += session.price;

        totalSessions++;
        totalAmount += session.price;
    });

    return {
        period: { start: startDate, end: endDate },
        byTherapist: Object.values(byTherapist),
        summary: {
            totalSessions,
            totalAmount,
            totalHours: sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60
        }
    };
};

/**
 * Check if event is non-billable (libre/anulada)
 */
const isNonBillable = (title) => {
    const lower = (title || '').toLowerCase();
    return lower.includes('libre') || lower.includes('anulada') || lower.includes('no disponible');
};

/**
 * Get raw events from Google Calendar (no processing)
 */
const getRawEvents = async (startDate, endDate) => {
    try {
        const authClient = await auth.getClient();
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        const response = await calendar.events.list({
            calendarId: 'esencialmentepsicologia@gmail.com', // Consistent ID
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 2500,
        });

        return response.data.items || [];
    } catch (error) {
        console.error('Error fetching raw events:', error);
        throw error;
    }
};

module.exports = {
    getSessions,
    getWeeklySummary,
    getWeeksOfMonth,
    calculatePrice,
    detectTherapist,
    getTherapistMap, // Export so other services can use it
    getRawEvents,
    isNonBillable,
    PRICING
};
