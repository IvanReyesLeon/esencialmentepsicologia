require('dotenv').config();
const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Terapeutas que no recibieron el correo hoy (excepto Anna que no recibe este email)
const pendingTherapists = [
    { full_name: 'ELISABET VIDAL MARCHANTE', email: 'evidalmarchante@gmail.com' },
    { full_name: 'Sonia Montesinos', email: 'SMontesinos92@gmail.com' }
];

async function sendPendingReminders() {
    console.log('📧 Sending pending weekly reminders...');

    const senderEmail = 'recordatorio@esencialmentepsicologia.com';
    const subject = 'Recordatorio: Pagos pendientes de revisar';

    for (const therapist of pendingTherapists) {
        const { full_name, email } = therapist;

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
                console.error(`❌ Error sending to ${email}:`, error);
            } else {
                console.log(`✅ Reminder sent to ${full_name} (${email})`);
            }
        } catch (err) {
            console.error(`❌ Exception sending to ${email}:`, err);
        }
    }

    console.log('✅ Done sending pending reminders.');
}

sendPendingReminders();
