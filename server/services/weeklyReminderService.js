const cron = require('node-cron');
const { Resend } = require('resend');
const { pool } = require('../config/db');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send weekly reminder emails to all therapists
 */
const sendWeeklyReminders = async () => {
    console.log('📧 Starting weekly payment reminder job...');

    try {
        // 1. Get all therapists with a valid email
        // We select full_name and email from therapist_billing_data
        const result = await pool.query(`
            SELECT full_name, email 
            FROM therapist_billing_data 
            WHERE email IS NOT NULL AND email != ''
        `);

        if (result.rows.length === 0) {
            console.log('⚠️ No therapists with email found for weekly reminder.');
            return;
        }

        console.log(`📧 Found ${result.rows.length} therapists to notify.`);

        const senderEmail = 'recordatorio@esencialmentepsicologia.com';
        const subject = 'Recordatorio: Pagos pendientes de revisar';

        // 2. Loop and send emails
        let sentCount = 0;
        let errorCount = 0;

        for (const therapist of result.rows) {
            const { full_name, email } = therapist;

            if (email === 'lu.gomez.psico@gmail.com') {
                console.log('Skipping weekly reminder for Lucia (Monthly schedule).');
                continue;
            }

            // Simple text content as requested
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6a1b9a;">Hola ${full_name || 'Terapeuta'},</h2>
                    <p>Recuerda revisar y reportar los pagos pendientes de esta semana.</p>
                    <p>Puedes acceder a tu panel de gestión aquí: <a href="https://www.esencialmentepsicologia.com/admin" style="color: #6a1b9a;">Ir al Panel</a></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888;">Este es un mensaje automático de Esencialmente Psicología.</p>
                </div>
            `;

            try {
                const { data, error } = await resend.emails.send({
                    from: `Esencialmente Psicología <${senderEmail}>`,
                    to: [email],
                    subject: subject,
                    html: htmlContent
                });

                if (error) {
                    console.error(`❌ Error sending weekly reminder to ${email}:`, error);
                    errorCount++;
                } else {
                    console.log(`✅ Weekly reminder sent to ${email}`);
                    sentCount++;
                }
            } catch (err) {
                console.error(`❌ Exception sending to ${email}:`, err);
                errorCount++;
            }
        }

        console.log(`✅ Weekly reminder job finished. Sent: ${sentCount}, Errors: ${errorCount}`);

    } catch (error) {
        console.error('❌ Critical error in weekly reminder job:', error);
    }
};

/**
 * Send monthly reminder (Lucia only)
 */
const sendMonthlyReminder = async () => {
    console.log('📧 Starting monthly payment reminder job (Lucia)...');
    try {
        const email = 'lu.gomez.psico@gmail.com';
        const subject = 'Recordatorio Mensual: Pagos pendientes';
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #6a1b9a;">Hola Lucía,</h2>
                <p>Recuerda revisar y reportar los pagos pendientes del mes.</p>
                <p>Puedes acceder a tu panel de gestión aquí: <a href="https://www.esencialmentepsicologia.com/admin" style="color: #6a1b9a;">Ir al Panel</a></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">Este es un mensaje automático mensual de Esencialmente Psicología.</p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: 'Esencialmente Psicología <recordatorio@esencialmentepsicologia.com>',
            to: [email],
            subject: subject,
            html: htmlContent
        });

        if (error) console.error('❌ Error sending monthly reminder:', error);
        else console.log('✅ Monthly reminder sent to Lucia.');

    } catch (err) {
        console.error('❌ Critical error in monthly reminder job:', err);
    }
};

/**
 * Start the cron jobs
 */
const startWeeklyReminderJob = () => {
    // Schedule for every Friday at 10:00 AM
    cron.schedule('0 10 * * 5', () => {
        sendWeeklyReminders();
    }, {
        scheduled: true,
        timezone: "Europe/Madrid"
    });

    console.log('⏰ Weekly payment reminder scheduled (Fridays at 10:00 AM Europe/Madrid).');

    // Schedule for the 28th of every month at 10:00 AM (Lucia)
    cron.schedule('0 10 28 * *', () => {
        sendMonthlyReminder();
    }, {
        scheduled: true,
        timezone: "Europe/Madrid"
    });
    console.log('⏰ Monthly payment reminder scheduled (28th at 10:00 AM Europe/Madrid).');
};

module.exports = {
    startWeeklyReminderJob,
    sendWeeklyReminders,
    sendMonthlyReminder
};
