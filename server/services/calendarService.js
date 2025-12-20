const { google } = require('googleapis');
const credentials = require('../credentials.json');

// Configure Auth
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    SCOPES
);

const calendar = google.calendar({ version: 'v3', auth });

/**
 * Helper to get week ranges (Monday to Sunday)
 */
const getWeekRange = (date = new Date()) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday

    const startOfWeek = new Date(current.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { start: startOfWeek, end: endOfWeek };
};

/**
 * Fetch events and aggregate duration by colorId
 * @param {string} calendarId 
 * @param {string} mode 'week' | 'month'
 */
const getAggregatedHours = async (calendarId, mode = 'week') => {
    try {
        const { start, end } = getWeekRange(); // Defaults to current week

        const response = await calendar.events.list({
            calendarId,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items;
        const colorTotals = {};

        events.forEach(event => {
            // Skip all-day events if necessary, or count them as 8h? 
            // Usually therapy sessions are timed. All-day events often lack dateTime.
            if (!event.start.dateTime || !event.end.dateTime) return;

            const startTime = new Date(event.start.dateTime);
            const endTime = new Date(event.end.dateTime);
            const durationHours = (endTime - startTime) / (1000 * 60 * 60);

            // Google Calendar Color ID (default to '0' if undefined)
            const colorId = event.colorId || 'default';

            if (!colorTotals[colorId]) {
                colorTotals[colorId] = 0;
            }
            colorTotals[colorId] += durationHours;
        });

        return {
            period: { start, end },
            totals: colorTotals,
            totalHours: Object.values(colorTotals).reduce((a, b) => a + b, 0)
        };

    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
};

module.exports = {
    getAggregatedHours
};
