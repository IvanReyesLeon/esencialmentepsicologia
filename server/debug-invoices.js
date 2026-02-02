
require('dotenv').config();
const { pool } = require('./config/db');

async function checkInvoices() {
    try {
        console.log('Checking invoice_submissions table...');
        console.log('DB URL:', process.env.DATABASE || process.env.DATABASE_URL ? 'Defined' : 'Undefined');

        const res = await pool.query('SELECT * FROM invoice_submissions');
        console.log(`Found ${res.rows.length} invoices.`);

        if (res.rows.length > 0) {
            console.log('First 5 invoices fields (id, year, month, therapist_id, total_amount, created_at):');
            res.rows.slice(0, 5).forEach(inv => {
                console.log({
                    id: inv.id,
                    year: inv.year,
                    month: inv.month,
                    therapist_id: inv.therapist_id,
                    total_amount: inv.total_amount,
                    created_at: inv.created_at,
                    invoice_number: inv.invoice_number
                });
            });
        } else {
            console.log('No invoices found in table.');
        }
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

checkInvoices();
