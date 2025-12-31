require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const EVENT_LOCATION = 'Carrer del Pintor Togores, 1, 08290 Cerdanyola del Vallès, Barcelona';

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

const endDatetime = new Date(tomorrow.getTime() + 60 * 60 * 1000);

const formatGoogleDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Sesión - Esencialmente Psicología')}&dates=${formatGoogleDate(tomorrow)}/${formatGoogleDate(endDatetime)}&location=${encodeURIComponent(EVENT_LOCATION)}&details=${encodeURIComponent('Sesión con Anna Becerra en Esencialmente Psicología')}`;

const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial;background:#f4f7f6;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,0.1)">
    <div style="padding:20px;text-align:center;border-bottom:2px solid #f0f0f0">
        <img src="https://www.esencialmentepsicologia.com/assets/images/Esencialmente_log.png" width="200" style="display:block;max-width:200px;height:auto;margin:0 auto" alt="Esencialmente Psicología">
    </div>
    <div style="padding:40px 30px;color:#333">
        <h2 style="color:#8c7ae6;text-align:center;text-transform:uppercase;letter-spacing:1px">Recordatorio de Cita</h2>
        <p>Hola,</p>
        <p>Te recordamos que tienes una próxima visita programada en <strong>Esencialmente Psicología</strong>.</p>
        
        <div style="background:#2f3640;color:#fff;padding:20px;border-radius:6px;border-left:5px solid #8c7ae6;margin:25px 0">
            <p style="margin:8px 0">📅 <strong>Fecha:</strong> 01/01/2026</p>
            <p style="margin:8px 0">⏰ <strong>Hora:</strong> 10:00</p>
            <p style="margin:8px 0">👩‍⚕️ <strong>Terapeuta:</strong> Anna Becerra</p>
        </div>
        
        <div style="text-align:center;margin:25px 0">
            <a href="${googleUrl}" target="_blank" style="display:inline-block;padding:12px 24px;border-radius:24px;text-decoration:none;font-size:14px;font-weight:500;background-color:#1a73e8;color:#ffffff">📅 Añadir a mi calendario</a>
        </div>
        
        <div style="background:#fff3cd;color:#856404;padding:15px;border-radius:6px;text-align:center;border:1px solid #ffeeba">
            ⚠️ Recuerda cancelarla con al menos 24 horas de antelación si no podrás asistir.
        </div>
    </div>
    <div style="background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee">
        <p><strong>Esencialmente Psicología</strong><br>
        Carrer del Pintor Togores, 1, 08290 Cerdanyola del Vallès, Barcelona<br>
        <a href="https://www.esencialmentepsicologia.com" style="color:#8c7ae6;text-decoration:none">www.esencialmentepsicologia.com</a></p>
    </div>
</div>
</body>
</html>
`;

async function send() {
    console.log('📧 Enviando a ivanreyesleon92@gmail.com...');
    try {
        const { data, error } = await resend.emails.send({
            from: 'Esencialmente Psicología <recordatorio@esencialmentepsicologia.com>',
            to: ['ivanreyesleon92@gmail.com'],
            subject: 'Recordatorio de Cita - Esencialmente Psicología',
            html: html
        });
        if (error) {
            console.log('❌ Error:', error);
        } else {
            console.log('✅ Enviado! ID:', data.id);
        }
    } catch (e) {
        console.log('❌ Exception:', e);
    }
}

send();
