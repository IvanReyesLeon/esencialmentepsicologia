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

// Therapist database mapping: lowercase name -> { id, fullName, colorId, color }
// This maps what users write between /slashes/ to therapist info
const THERAPIST_MAP = {
    'sara': { id: 8, name: 'Sara Ochoa', colorId: '5', color: '#f6c026' },
    'miriam': { id: 5, name: 'Miriam Expósito', colorId: '1', color: '#7986cb' },
    'eli': { id: 11, name: 'Elisabet Vidal', colorId: '6', color: '#f4511e' },
    'elisabet': { id: 11, name: 'Elisabet Vidal', colorId: '6', color: '#f4511e' },
    'moni': { id: 7, name: 'Mónica Vidal', colorId: '8', color: '#616161' },
    'monica': { id: 7, name: 'Mónica Vidal', colorId: '8', color: '#616161' },
    'mónica': { id: 7, name: 'Mónica Vidal', colorId: '8', color: '#616161' },
    'lucia': { id: 2, name: 'Lucía Gómez', colorId: '2', color: '#33b679' },
    'lucía': { id: 2, name: 'Lucía Gómez', colorId: '2', color: '#33b679' },
    'yaiza': { id: 4, name: 'Yaiza González', colorId: '7', color: '#039be5' },
    'sonia': { id: 6, name: 'Sonia Montesinos', colorId: '4', color: '#e67c73' },
    'anna': { id: 1, name: 'Anna Becerra', colorId: '11', color: '#d50000' },
    'christian': { id: 3, name: 'Christian Ayuste', colorId: '10', color: '#0b8043' },
    'chris': { id: 3, name: 'Christian Ayuste', colorId: '10', color: '#0b8043' },
    'cèlia': { id: 10, name: 'Cèlia Morales', colorId: '3', color: '#8e24aa' },
    'celia': { id: 10, name: 'Cèlia Morales', colorId: '3', color: '#8e24aa' },
    'joan': { id: 9, name: 'Joan Miralles', colorId: '9', color: '#3f51b5' },
    'patri': { id: 6, name: 'Patri', colorId: '4', color: '#e67c73' },
};

/**
 * Normalize text by removing accents for comparison
 */
const normalizeText = (text) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};

/**
 * Detect therapist from event title using /nombre/ format or plain name
 * Priority 1: "/nombre/" format (e.g., "/sara/", "/joan/")
 * Priority 2: Plain name in title (e.g., "Laura t moni", "Irene - Sara pag")
 * Handles accent variations: Cèlia or Celia
 */
const detectTherapist = (title) => {
    const normalizedTitle = normalizeText(title);

    // Priority 1: Extract text between slashes: /nombre/
    const match = title.match(/\/([^/]+)\//);

    if (match) {
        const therapistTag = match[1].toLowerCase().trim();
        const normalizedTag = normalizeText(match[1]);

        // First try exact match
        if (THERAPIST_MAP[therapistTag]) {
            return THERAPIST_MAP[therapistTag];
        }

        // Try normalized match (without accents)
        if (THERAPIST_MAP[normalizedTag]) {
            return THERAPIST_MAP[normalizedTag];
        }
    }

    // Priority 2: Search for therapist names anywhere in the title
    // Use word boundaries to avoid partial matches
    for (const [key, therapist] of Object.entries(THERAPIST_MAP)) {
        // Create a pattern that matches the key as a separate word
        const pattern = new RegExp(`\\b${key}\\b`, 'i');
        if (pattern.test(normalizedTitle)) {
            return therapist;
        }
    }

    // No therapist detected
    return { id: null, name: 'Sin asignar', colorId: 'default', color: '#e0e0e0' };
};



/**
 * Get individual sessions for a date range
 * @param {string} calendarId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {number|null} colorId - Filter by therapist color (null = all)
 */
const getSessions = async (calendarId, startDate, endDate, colorId = null) => {
    try {
        const authClient = await auth.getClient();
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

            // Detect therapist from title using /nombre/ format
            const therapist = detectTherapist(event.summary || '');

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
    getRawEvents,
    isNonBillable,
    PRICING
};
