const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
});

const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

async function getFullEvent() {
    console.log('=== Buscando Lucia ===\n');

    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    // Buscar en todo el día de septiembre 30
    const response = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: '2025-09-30T00:00:00Z',
        timeMax: '2025-10-01T00:00:00Z',
        singleEvents: true,
    });

    const events = response.data.items || [];
    const luciaEvent = events.find(e => e.summary && e.summary.includes('Lucia'));

    if (luciaEvent) {
        console.log('EVENTO LUCIA COMPLETO:');
        console.log(JSON.stringify(luciaEvent, null, 2));
    } else {
        console.log('No encontrado. Eventos disponibles:');
        events.forEach(e => console.log(' -', e.summary));
    }
}

getFullEvent().catch(console.error);
