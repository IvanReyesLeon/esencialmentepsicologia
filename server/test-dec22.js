const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
});

const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

// Therapist mapping (same as calendarService)
const THERAPIST_MAP = {
    'sara': { id: 8, name: 'Sara Ochoa', colorId: '5', color: '#f6c026' },
    'miriam': { id: 5, name: 'Miriam Expósito', colorId: '1', color: '#7986cb' },
    'eli': { id: 11, name: 'Elisabet Vidal', colorId: '6', color: '#f4511e' },
    'elisabet': { id: 11, name: 'Elisabet Vidal', colorId: '6', color: '#f4511e' },
    'moni': { id: 7, name: 'Mónica Vidal', colorId: '8', color: '#616161' },
    'monica': { id: 7, name: 'Mónica Vidal', colorId: '8', color: '#616161' },
    'lucia': { id: 2, name: 'Lucía Gómez', colorId: '2', color: '#33b679' },
    'yaiza': { id: 4, name: 'Yaiza González', colorId: '7', color: '#039be5' },
    'sonia': { id: 6, name: 'Sonia Montesinos', colorId: '4', color: '#e67c73' },
    'anna': { id: 1, name: 'Anna Becerra', colorId: '11', color: '#d50000' },
    'christian': { id: 3, name: 'Christian Ayuste', colorId: '10', color: '#0b8043' },
    'chris': { id: 3, name: 'Christian Ayuste', colorId: '10', color: '#0b8043' },
    'celia': { id: 10, name: 'Cèlia Morales', colorId: '3', color: '#8e24aa' },
    'joan': { id: 9, name: 'Joan Miralles', colorId: '9', color: '#3f51b5' },
    'patri': { id: 6, name: 'Patri', colorId: '4', color: '#e67c73' },
};

const detectTherapist = (title) => {
    const match = title.match(/\/([^/]+)\//);
    if (match) {
        const therapistTag = match[1].toLowerCase().trim();
        if (THERAPIST_MAP[therapistTag]) {
            return THERAPIST_MAP[therapistTag];
        }
    }
    return { id: null, name: 'Sin asignar', colorId: 'default', color: '#e0e0e0' };
};

async function testDecember22() {
    console.log('=== Testing December 22, 2025 ===\n');

    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const response = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: '2025-12-22T00:00:00+01:00',
        timeMax: '2025-12-22T23:59:59+01:00',
        singleEvents: true,
        orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`Found ${events.length} events:\n`);

    events.forEach((event, i) => {
        const therapist = detectTherapist(event.summary || '');
        console.log(`${i + 1}. "${event.summary}"`);
        console.log(`   → Terapeuta: ${therapist.name} (color: ${therapist.color})`);
        console.log('');
    });
}

testDecember22().catch(console.error);
