const cron = require('node-cron');
const { Resend } = require('resend');
const { pool } = require('../config/db');
const { getRawEvents, detectTherapist } = require('./calendarService');

const resend = new Resend(process.env.RESEND_API_KEY);

// Regex for extracting email
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const checkAndSendReminders = async () => {
    console.log('⏰ Running reminder check...');
    try {
        // 1. Calculate time range: NOW + 30 hours (start) to NOW + 31 hours (end)
        // We look for events STARTING in this window.
        // Actually, user said "24h antes". So if event is tomorrow at 10:00, we send today at 10:00.
        // We run hourly. We check events starting between "24h from now" and "25h from now".

        const now = new Date();
        // Calculate the time window (e.g., sessions starting in 48 hours)
        const startWindow = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48 hours
        const endWindow = new Date(now.getTime() + 49 * 60 * 60 * 1000);   // +49 hours

        // Fetch raw events
        const events = await getRawEvents(startWindow, endWindow);
        console.log(`📅 Found ${events.length} events starting between ${startWindow.toISOString()} and ${endWindow.toISOString()}`);

        for (const event of events) {
            // Skip if no summary
            if (!event.summary) continue;

            // 2. Extract email
            const textToSearch = (event.summary + ' ' + (event.description || '')).toLowerCase();
            const emailMatch = textToSearch.match(EMAIL_REGEX);

            if (!emailMatch) {
                continue; // No email found
            }

            const clientEmail = emailMatch[0];

            // 3. Check DB if already sent
            const existing = await pool.query(
                'SELECT id FROM sent_reminder_emails WHERE event_id = $1 AND email = $2',
                [event.id, clientEmail]
            );

            if (existing.rows.length > 0) {
                // Already sent
                continue;
            }

            // 4. Detect Therapist
            const therapist = detectTherapist(event.summary);
            const therapistName = therapist.name === 'Sin asignar' ? 'Esencialmente Psicología' : therapist.name;

            // 5. Send Email
            const startDate = new Date(event.start.dateTime || event.start.date);
            const dateStr = startDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            // Ensure sender is configured
            const senderEmail = 'recordatorio@esencialmentepsicologia.com';

            const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
                    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                    .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 2px solid #f0f0f0; }
                    .logo { max-width: 200px; height: auto; display: block; margin: 0 auto; }
                    .content { padding: 40px 30px; color: #333; line-height: 1.6; }
                    .title { color: #8c7ae6; font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
                    .card { background-color: #2f3640; color: #ffffff; padding: 20px; border-radius: 6px; border-left: 5px solid #8c7ae6; margin: 25px 0; }
                    .row { display: flex; align-items: center; margin-bottom: 12px; }
                    .row:last-child { margin-bottom: 0; }
                    .icon { margin-right: 12px; font-size: 20px; }
                    .label { font-weight: bold; margin-right: 5px; color: #dcdde1; }
                    .value { font-weight: 600; font-size: 16px; }
                    .alert-box { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 6px; border: 1px solid #ffeeba; font-size: 14px; text-align: center; margin-top: 25px; }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
                    
                    /* Dark Mode: We ONLY override the body background to be dark, but keep the container WHITE */
                    /* This ensures the user gets the "Paper" look they liked, even on dark phones */
                    @media (prefers-color-scheme: dark) {
                        body { background-color: #1a1a1a !important; }
                        .email-container { background-color: #ffffff !important; } /* Force White */
                        .content { color: #333333 !important; } /* Force Dark Text */
                        .footer { background-color: #f8f9fa !important; color: #888 !important; }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <!-- Header -->
                    <div class="header">
                        <img src="https://www.esencialmentepsicologia.com/assets/images/Esencialmente_log.png" alt="Esencialmente Psicología" class="logo">
                    </div>
                    
                    <div class="content">
                        <div class="title">Recordatorio de Cita</div>
                        <p>Hola,</p>
                        <p>Te recordamos que tienes una próxima visita programada en <strong>Esencialmente Psicología</strong>.</p>
                        
                        <!-- Dark Card with Info -->
                        <div class="card">
                            <div class="row">
                                <span class="icon">📅</span>
                                <span class="label">Fecha:</span>
                                <span class="value">${new Date(session.start.dateTime || session.start.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            </div>
                            <div class="row">
                                <span class="icon">⏰</span>
                                <span class="label">Hora:</span>
                                <span class="value">${new Date(session.start.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div class="row">
                                <span class="icon">👩‍⚕️</span>
                                <span class="label">Terapeuta:</span>
                                <span class="value">${therapist ? therapist.name : 'Terapeuta'}</span>
                            </div>
                        </div>

                        <!-- Yellow Warning Alert -->
                        <div class="alert-box">
                            ⚠️ Recuerda cancelarla con al menos 24 horas de antelación si no podrás asistir.
                        </div>
                    </div>

                    <div class="footer">
                        <p><strong>Esencialmente Psicología</strong><br>
                        Carrer del Pintor Togores, 1, 08290 Cerdanyola del Vallès, Barcelona<br>
                        <a href="https://www.esencialmentepsicologia.com" style="color: #8c7ae6; text-decoration: none;">www.esencialmentepsicologia.com</a></p>
                    </div>
                </div>
            </body>
            </html>
            `;
            try {
                const { data, error } = await resend.emails.send({
                    from: `Esencialmente Psicología <${senderEmail}>`,
                    to: [clientEmail],
                    subject: 'Recordatorio de Cita - Esencialmente Psicología',
                    html: htmlContent
                });

                if (error) {
                    console.error('❌ Error sending reminder email:', error);
                    continue;
                }

                console.log(`✅ Reminder sent to ${clientEmail} for event ${event.id}`);

                // 6. Save to DB
                await pool.query(
                    'INSERT INTO sent_reminder_emails (event_id, email) VALUES ($1, $2)',
                    [event.id, clientEmail]
                );

            } catch (sendError) {
                console.error('❌ Exception sending email:', sendError);
            }
        }

    } catch (error) {
        console.error('❌ Error in checkAndSendReminders:', error);
    }
};

const startReminderJob = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', () => {
        checkAndSendReminders();
    });
    console.log('⏰ Reminder cron job scheduled (every hour).');
};

module.exports = { startReminderJob };
