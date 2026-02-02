require('dotenv').config();
const { pool } = require('./config/db');
const { getSessions } = require('./services/calendarService');

async function recalculateInvoices() {
    try {
        console.log('🔄 Starting invoice recalculation...');

        // 1. Get all invoices
        const res = await pool.query('SELECT * FROM invoice_submissions');
        const invoices = res.rows;

        console.log(`Found ${invoices.length} invoices to check.`);

        for (const invoice of invoices) {
            console.log(`Processing Invoice #${invoice.invoice_number || 'draft'} for Therapist ${invoice.therapist_id}...`);

            // 2. Fetch ALL sessions for this period
            // Calculate start and end calculation
            const year = parseInt(invoice.year);
            const month = parseInt(invoice.month);

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59); // Last day of month

            const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

            const sessions = await getSessions(CALENDAR_ID, startDate, endDate);

            // Filter sessions for this therapist
            // Note: getSessions returns all sessions for the month
            // We need to match therapist. In frontend we filter by therapist name/id map.
            // invoice.therapist_id matches our DB id.
            // But sessions from calendarService might not have therapist_id directly attached if not mapped properly?
            // Actually getSessions calls getTherapistMap internally and assigns therapistId.

            const therapistSessions = sessions.filter(s => s.therapistId === invoice.therapist_id);

            // Fetch payment statuses (critical for cancellations and modified prices)
            const sessionIds = therapistSessions.map(s => s.id);
            let payments = [];
            if (sessionIds.length > 0) {
                const paymentResult = await pool.query(
                    `SELECT event_id, payment_type, marked_at, original_price, modified_price 
                     FROM session_payments 
                     WHERE event_id = ANY($1) AND therapist_id = $2`,
                    [sessionIds, invoice.therapist_id]
                );
                payments = paymentResult.rows;
            }

            const paymentMap = {};
            payments.forEach(p => paymentMap[p.event_id] = p);

            // Apply payment logic (overrides and cancellations)
            const billableSessions = [];
            therapistSessions.forEach(session => {
                const payment = paymentMap[session.id];
                if (payment) {
                    if (payment.original_price) session.price = parseFloat(payment.original_price);
                    if (payment.modified_price) session.price = parseFloat(payment.modified_price);
                    session.paymentStatus = payment.payment_type;
                } else {
                    session.paymentStatus = 'pending';
                }

                // Filter out cancelled and non-billable
                // Also check isLibre if available (property from specific calendar parsing service)
                if (session.price > 0 && session.paymentStatus !== 'cancelled' && !session.isLibre) {
                    billableSessions.push(session);
                }
            });

            // 3. Filter excluded sessions
            let excludedIds = new Set();
            if (invoice.excluded_session_ids) {
                const ids = typeof invoice.excluded_session_ids === 'string'
                    ? JSON.parse(invoice.excluded_session_ids)
                    : invoice.excluded_session_ids;
                ids.forEach(id => excludedIds.add(id));
            }

            // In invoice preview, exclusions are applied to billable sessions
            const activeSessions = billableSessions.filter(s => !excludedIds.has(s.id));

            // 4. Calculate Totals
            const subtotal = activeSessions.reduce((sum, s) => sum + (s.price || 0), 0);

            // Recalculate derived amounts
            // Restore percentages from the invoice record (assuming they don't change)
            // But if subtotal changed, amounts change.
            // center_percentage + therapist_percentage = 100
            // We can derive therapist_percentage from center_percentage stored?
            // Wait, calculate from scratch using center_percentage stored in invoice
            const centerPercentage = parseFloat(invoice.center_percentage);
            // Warning: stored as numeric/string.

            const centerAmount = subtotal * (centerPercentage / 100);
            const baseDisponible = subtotal - centerAmount;
            const irpfPercentage = parseFloat(invoice.irpf_percentage);
            const irpfAmount = baseDisponible * (irpfPercentage / 100);
            const totalFactura = baseDisponible - irpfAmount;

            console.log(`   Old Total: ${invoice.total_amount} -> New Total: ${totalFactura}`);

            // 5. Update Database
            await pool.query(
                `UPDATE invoice_submissions 
                 SET subtotal = $1, center_amount = $2, irpf_amount = $3, total_amount = $4
                 WHERE id = $5`,
                [subtotal, centerAmount, irpfAmount, totalFactura, invoice.id]
            );
        }

        console.log('✅ Recalculation complete!');

    } catch (error) {
        console.error('❌ Error recalculating invoices:', error);
    } finally {
        pool.end();
    }
}

recalculateInvoices();
