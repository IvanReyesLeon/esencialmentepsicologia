require('dotenv').config();
const { pool } = require('./config/db');
const { getSessions } = require('./services/calendarService');

async function debugInvoice() {
    try {
        console.log('🔍 Searching for Invoice AB0126...');
        const res = await pool.query("SELECT * FROM invoice_submissions WHERE invoice_number = 'AB0126'");

        if (res.rows.length === 0) {
            console.log('❌ Invoice AB0126 not found in local DB.');
            console.log('Listing latest 5 invoices instead:');
            const latest = await pool.query("SELECT id, invoice_number, therapist_id, total_amount FROM invoice_submissions ORDER BY id DESC LIMIT 5");
            console.table(latest.rows);
            return;
        }

        const invoice = res.rows[0];
        console.log('✅ Invoice Found:', {
            id: invoice.id,
            number: invoice.invoice_number,
            therapist_id: invoice.therapist_id,
            month: invoice.month,
            year: invoice.year,
            subtotal: invoice.subtotal,
            total: invoice.total_amount,
            excluded_json: invoice.excluded_session_ids,
            type_of_excluded: typeof invoice.excluded_session_ids
        });

        // Parse excluded IDs
        let excludedIds = new Set();
        if (invoice.excluded_session_ids) {
            const ids = typeof invoice.excluded_session_ids === 'string'
                ? JSON.parse(invoice.excluded_session_ids)
                : invoice.excluded_session_ids;
            ids.forEach(id => excludedIds.add(id));
            console.log('🚫 Excluded IDs Set:', Array.from(excludedIds));
        }

        // Fetch Sessions
        const year = parseInt(invoice.year);
        const month = parseInt(invoice.month);
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);
        const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

        console.log(`📅 Fetching sessions for ${startDate.toISOString()} to ${endDate.toISOString()}...`);
        const sessions = await getSessions(CALENDAR_ID, startDate, endDate);

        const therapistSessions = sessions.filter(s => s.therapistId === invoice.therapist_id);
        console.log(`found ${therapistSessions.length} sessions for therapist ${invoice.therapist_id}`);

        let matchCount = 0;
        therapistSessions.forEach(s => {
            const isExcluded = excludedIds.has(s.id);
            if (isExcluded) {
                console.log(`   [MATCH] Session ${s.id} (${s.summary}) is EXCLUDED.`);
                matchCount++;
            } else {
                // console.log(`   [OK] Session ${s.id} included.`);
            }
        });

        console.log(`Found ${matchCount} sessions matching excluded list.`);

        const activeSessions = therapistSessions.filter(s => !excludedIds.has(s.id));
        const subtotal = activeSessions.reduce((sum, s) => sum + (s.price || 0), 0);

        console.log(`🧮 Calculated Subtotal: ${subtotal} €`);
        console.log(`💾 Stored Subtotal: ${invoice.subtotal} €`);

        if (Math.abs(subtotal - parseFloat(invoice.subtotal)) > 0.01) {
            console.log('❌ DISCREPANCY DETECTED!');
        } else {
            console.log('✅ Values match.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

debugInvoice();
