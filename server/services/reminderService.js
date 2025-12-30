const cron = require('node-cron');
const { Resend } = require('resend');
const { pool } = require('../config/db');
const { getRawEvents, detectTherapist } = require('./calendarService');

const resend = new Resend(process.env.RESEND_API_KEY);

// Regex for extracting email
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Sync calendar events to the reminder_queue table.
 * Scans next 7 days and ensures all events with emails are tracked.
 */
const syncCalendarToQueue = async () => {
    console.log('📅 Syncing calendar events to reminder queue...');
    try {
        const now = new Date();
        const startWindow = new Date(now);
        const endWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

        const events = await getRawEvents(startWindow, endWindow);
        console.log(`📅 Found ${events.length} events in the next 7 days`);

        let addedCount = 0;
        let skippedCount = 0;

        for (const event of events) {
            if (!event.summary) continue;

            // Extract email from title or description
            const textToSearch = (event.summary + ' ' + (event.description || '')).toLowerCase();
            const emailMatch = textToSearch.match(EMAIL_REGEX);

            if (!emailMatch) {
                continue; // No email found
            }

            const patientEmail = emailMatch[0];

            // Debug: Log the raw calendar datetime
            const rawDatetime = event.start.dateTime || event.start.date;
            console.log(`📅 Calendar event raw datetime: ${rawDatetime} for ${patientEmail}`);

            const sessionDatetime = new Date(rawDatetime);
            console.log(`📅 Parsed as Date object: ${sessionDatetime.toISOString()}`);

            // Calculate when to send (48h before session)
            const scheduledSendAt = new Date(sessionDatetime.getTime() - 48 * 60 * 60 * 1000);

            // Detect therapist
            const therapist = detectTherapist(event.summary);
            const therapistName = therapist.name === 'Sin asignar' ? null : therapist.name;

            try {
                // Insert or ignore if already exists (UNIQUE constraint on event_id + patient_email)
                const result = await pool.query(`
                    INSERT INTO reminder_queue (event_id, patient_email, session_datetime, scheduled_send_at, therapist_name, status)
                    VALUES ($1, $2, $3, $4, $5, 'pending')
                    ON CONFLICT (event_id, patient_email) DO NOTHING
                    RETURNING id
                `, [event.id, patientEmail, sessionDatetime, scheduledSendAt, therapistName]);

                if (result.rows.length > 0) {
                    console.log(`✅ Added to queue: ${patientEmail} for session on ${sessionDatetime.toISOString()}`);
                    addedCount++;
                } else {
                    skippedCount++;
                }
            } catch (insertError) {
                console.error(`❌ Error inserting to queue:`, insertError.message);
            }
        }

        console.log(`📊 Sync complete: ${addedCount} added, ${skippedCount} already in queue`);

    } catch (error) {
        console.error('❌ Error syncing calendar to queue:', error);
    }
};

/**
 * Generate email HTML content for a reminder
 */
const generateEmailHtml = (sessionDatetime, therapistName) => {
    // Debug: Log the input datetime
    console.log(`📧 generateEmailHtml - Input datetime: ${sessionDatetime.toISOString()}`);
    console.log(`📧 generateEmailHtml - Input datetime (local): ${sessionDatetime.toString()}`);

    // Use Intl.DateTimeFormat for reliable timezone conversion
    const dateFormatter = new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Madrid'
    });
    const timeFormatter = new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Madrid'
    });

    const dateStr = dateFormatter.format(sessionDatetime);
    const timeStr = timeFormatter.format(sessionDatetime);

    // Debug: Log the formatted output
    console.log(`📧 generateEmailHtml - Output date: ${dateStr}, time: ${timeStr}`);

    const displayTherapist = therapistName || 'Esencialmente Psicología';

    return `
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
            
            @media (prefers-color-scheme: dark) {
                body { background-color: #1a1a1a !important; }
                .email-container { background-color: #ffffff !important; }
                .content { color: #333333 !important; }
                .footer { background-color: #f8f9fa !important; color: #888 !important; }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <img src="https://www.esencialmentepsicologia.com/assets/images/Esencialmente_log.png" alt="Esencialmente Psicología" class="logo">
            </div>
            
            <div class="content">
                <div class="title">Recordatorio de Cita</div>
                <p>Hola,</p>
                <p>Te recordamos que tienes una próxima visita programada en <strong>Esencialmente Psicología</strong>.</p>
                
                <div class="card">
                    <div class="row">
                        <span class="icon">📅</span>
                        <span class="label">Fecha:</span>
                        <span class="value">${dateStr}</span>
                    </div>
                    <div class="row">
                        <span class="icon">⏰</span>
                        <span class="label">Hora:</span>
                        <span class="value">${timeStr}</span>
                    </div>
                    <div class="row">
                        <span class="icon">👩‍⚕️</span>
                        <span class="label">Terapeuta:</span>
                        <span class="value">${displayTherapist}</span>
                    </div>
                </div>

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
};

/**
 * Process pending reminders from the queue.
 * Sends emails for all reminders where scheduled_send_at <= now AND status = 'pending'
 */
const processPendingReminders = async () => {
    console.log('📬 Processing pending reminders...');
    try {
        const now = new Date();

        // Get all pending reminders that should be sent by now
        // Also get reminders for sessions that have already started (catch-up)
        const result = await pool.query(`
            SELECT id, event_id, patient_email, session_datetime, therapist_name, scheduled_send_at
            FROM reminder_queue
            WHERE status = 'pending' 
            AND (scheduled_send_at <= $1 OR session_datetime <= $1)
            ORDER BY session_datetime ASC
        `, [now]);

        console.log(`📬 Found ${result.rows.length} reminders to process`);

        for (const reminder of result.rows) {
            // pg driver returns Date objects for timestamps - use directly if it's already a Date
            const sessionDatetime = reminder.session_datetime instanceof Date
                ? reminder.session_datetime
                : new Date(reminder.session_datetime);
            console.log(`   🔍 Final sessionDatetime toString: ${sessionDatetime.toString()}`);

            // Skip if session has already passed
            if (sessionDatetime < now) {
                console.log(`⏭️ Skipping reminder for ${reminder.patient_email} - session already passed`);
                await pool.query(`
                    UPDATE reminder_queue 
                    SET status = 'failed', sent_at = NOW() 
                    WHERE id = $1
                `, [reminder.id]);
                continue;
            }

            try {
                // Check if we've already sent to this event/email combo (legacy table check)
                const legacyCheck = await pool.query(
                    'SELECT id FROM sent_reminder_emails WHERE event_id = $1 AND email = $2',
                    [reminder.event_id, reminder.patient_email]
                );

                if (legacyCheck.rows.length > 0) {
                    // Already sent via legacy system, mark as sent
                    await pool.query(`
                        UPDATE reminder_queue SET status = 'sent', sent_at = NOW() WHERE id = $1
                    `, [reminder.id]);
                    console.log(`⏭️ Already sent (legacy) to ${reminder.patient_email}`);
                    continue;
                }

                // Send email
                const htmlContent = generateEmailHtml(sessionDatetime, reminder.therapist_name);
                const senderEmail = 'recordatorio@esencialmentepsicologia.com';

                const { data, error } = await resend.emails.send({
                    from: `Esencialmente Psicología <${senderEmail}>`,
                    to: [reminder.patient_email],
                    subject: 'Recordatorio de Cita - Esencialmente Psicología',
                    html: htmlContent
                });

                if (error) {
                    console.error(`❌ Error sending to ${reminder.patient_email}:`, error);
                    await pool.query(`
                        UPDATE reminder_queue SET status = 'failed' WHERE id = $1
                    `, [reminder.id]);
                    continue;
                }

                console.log(`✅ Reminder sent to ${reminder.patient_email} for session on ${sessionDatetime.toISOString()}`);

                // Update queue status and save the email HTML
                await pool.query(`
                    UPDATE reminder_queue SET status = 'sent', sent_at = NOW(), sent_email_html = $2 WHERE id = $1
                `, [reminder.id, htmlContent]);

                // Also insert into legacy table for backwards compatibility
                await pool.query(
                    'INSERT INTO sent_reminder_emails (event_id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [reminder.event_id, reminder.patient_email]
                );

            } catch (sendError) {
                console.error(`❌ Exception sending email to ${reminder.patient_email}:`, sendError);
                await pool.query(`
                    UPDATE reminder_queue SET status = 'failed' WHERE id = $1
                `, [reminder.id]);
            }
        }

    } catch (error) {
        console.error('❌ Error processing pending reminders:', error);
    }
};

/**
 * Main reminder check function - runs sync and then processes pending
 */
const checkAndSendReminders = async () => {
    console.log('⏰ Running reminder check...');
    await syncCalendarToQueue();
    await processPendingReminders();
    console.log('✅ Reminder check complete');
};

/**
 * Get reminder stats for admin panel
 */
const getReminderStats = async () => {
    const result = await pool.query(`
        SELECT 
            status,
            COUNT(*) as count
        FROM reminder_queue
        WHERE session_datetime > NOW() - INTERVAL '7 days'
        GROUP BY status
    `);

    const stats = { pending: 0, sent: 0, failed: 0 };
    result.rows.forEach(row => {
        stats[row.status] = parseInt(row.count);
    });

    return stats;
};

/**
 * Get reminders list for admin panel
 */
const getReminders = async (status = null, limit = 50) => {
    let query = `
        SELECT id, event_id, patient_email, session_datetime, scheduled_send_at, 
               status, sent_at, created_at, therapist_name
        FROM reminder_queue
        WHERE session_datetime > NOW() - INTERVAL '7 days'
    `;

    const params = [];
    if (status) {
        query += ` AND status = $1`;
        params.push(status);
    }

    query += ` ORDER BY session_datetime ASC LIMIT ${parseInt(limit)}`;

    const result = await pool.query(query, params);
    return result.rows;
};

/**
 * Get email preview for a specific reminder
 * Returns saved HTML if available, otherwise regenerates it
 */
const getReminderEmailPreview = async (reminderId) => {
    const result = await pool.query(`
        SELECT id, patient_email, session_datetime, therapist_name, status, sent_email_html
        FROM reminder_queue
        WHERE id = $1
    `, [reminderId]);

    if (result.rows.length === 0) {
        return null;
    }

    const reminder = result.rows[0];

    // If we have saved HTML, return it
    if (reminder.sent_email_html) {
        return {
            id: reminder.id,
            email: reminder.patient_email,
            status: reminder.status,
            html: reminder.sent_email_html,
            isRegenerated: false
        };
    }

    // Otherwise, regenerate the email (for old emails without saved HTML)
    const sessionDatetime = reminder.session_datetime instanceof Date
        ? reminder.session_datetime
        : new Date(reminder.session_datetime);
    const html = generateEmailHtml(sessionDatetime, reminder.therapist_name);

    return {
        id: reminder.id,
        email: reminder.patient_email,
        status: reminder.status,
        html: html,
        isRegenerated: true // Indicates this is regenerated, not the actual sent email
    };
};

const startReminderJob = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', () => {
        checkAndSendReminders();
    });
    console.log('⏰ Reminder cron job scheduled (every hour).');

    // Also run immediately on startup to catch up on any missed reminders
    setTimeout(() => {
        console.log('🚀 Running initial reminder check on startup...');
        checkAndSendReminders();
    }, 5000); // Wait 5 seconds for DB connection to stabilize
};

module.exports = {
    startReminderJob,
    checkAndSendReminders,
    getReminderStats,
    getReminders,
    getReminderEmailPreview,
    syncCalendarToQueue,
    processPendingReminders
};
