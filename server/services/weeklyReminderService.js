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
 * Start the cron job
 */
const startWeeklyReminderJob = () => {
    // Schedule for every Friday at 10:00 AM
    // Cron format: Minute Hour DayMonth Month DayWeek
    // 0 10 * * 5 = 10:00 on Friday
    cron.schedule('0 10 * * 5', () => {
        sendWeeklyReminders();
    }, {
        scheduled: true,
        timezone: "Europe/Madrid"
    });

    console.log('⏰ Weekly payment reminder scheduled (Fridays at 10:00 AM Europe/Madrid).');
};

module.exports = {
    startWeeklyReminderJob,
    sendWeeklyReminders // Exported for manual testing if needed
};
