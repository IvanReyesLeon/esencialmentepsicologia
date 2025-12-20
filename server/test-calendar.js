const { google } = require('googleapis');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

async function testWithGoogleAuth() {
    console.log('=== Testing with GoogleAuth ===\n');

    try {
        // Use GoogleAuth with the keyFile path
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, 'credentials.json'),
            scopes: SCOPES,
        });

        console.log('1. Creating auth client...');
        const authClient = await auth.getClient();
        console.log('   ✅ Auth client created');

        console.log('\n2. Testing Calendar API...');
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: startOfMonth.toISOString(),
            timeMax: endOfMonth.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 20,
        });

        console.log('   ✅ Calendar API call successful!');
        console.log('   Events found this month:', response.data.items?.length || 0);

        if (response.data.items?.length > 0) {
            console.log('\n   Sample events:');
            response.data.items.slice(0, 5).forEach((event, i) => {
                console.log(`   ${i + 1}. ${event.summary} | Color: ${event.colorId || 'default'} | ${event.start.dateTime?.split('T')[0] || event.start.date}`);
            });
        }

    } catch (error) {
        console.log('\n❌ Error:', error.message);

        if (error.code === 403 || error.message.includes('forbidden')) {
            console.log('\n⚠️ La API de Calendar puede no estar habilitada.');
            console.log('   Ve a: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com');
        }

        if (error.code === 404) {
            console.log('\n⚠️ Calendario no encontrado.');
        }
    }
}

testWithGoogleAuth();
