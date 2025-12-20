require('dotenv').config();
const { Resend } = require('resend');

const key = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
const resend = new Resend(key);

const sendTestEmail = async () => {
    const emails = ['abecerrapsicologa@gmail.com', 'ivanreyesleon92@gmail.com'];
    const senderEmail = 'recordatorio@esencialmentepsicologia.com';

    // Simulations
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const dateStr = startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = '10:00';
    const therapistName = 'Sara Ochoa';

    const logoUrl = 'https://www.esencialmentepsicologia.com/assets/images/Esencialmente_log.png';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>Recordatorio de Cita</title>
        <style>
            /* Base reset */
            body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
            
            /* Theme Colors */
            :root {
                color-scheme: light dark;
                supported-color-schemes: light dark;
            }

            /* Container & Body logic */
            .body-bg { background-color: #f4f7f6; }
            .content-bg { background-color: #ffffff; }
            .text-main { color: #333333; }
            .text-muted { color: #666666; }
            .card-bg { background-color: #f9f9f9; }
            
            /* Dark Mode Support via Media Query */
            @media (prefers-color-scheme: dark) {
                .body-bg { background-color: #1a1a1a !important; }
                .content-bg { background-color: #2d2d2d !important; border-color: #444 !important; }
                .text-main { color: #ffffff !important; }
                .text-muted { color: #cccccc !important; }
                .card-bg { background-color: #383838 !important; }
                .link { color: #d980fa !important; }
                /* In dark mode, we keep the logo header white so the logo is visible */
                .header-cell { background-color: #ffffff !important; } 
            }

            /* Mobile Stack Layout */
            @media only screen and (max-width: 480px) {
                .mobile-stack { display: block !important; width: 100% !important; padding-bottom: 5px; }
                .mobile-padding { padding: 20px !important; }
                .card-row { flex-direction: column; }
                .card-label { width: 100% !important; margin-bottom: 4px !important; }
                .card-value { width: 100% !important; }
            }
        </style>
    </head>
    <body class="body-bg">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="body-bg" style="padding: 40px 0;">
            <tr>
                <td align="center">
                    <!-- Main Container -->
                    <table border="0" cellpadding="0" cellspacing="0" width="600" class="content-bg" style="max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                        <!-- Header / Logo -->
                        <!-- FORCE WHITE BACKGROUND for logo visibility in all modes -->
                        <tr>
                            <td align="center" class="header-cell" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 2px solid #f0f0f0;">
                                <img src="${logoUrl}" alt="Esencialmente Psicología" width="220" style="display: block; max-width: 220px; height: auto;">
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td class="mobile-padding" style="padding: 40px 40px 20px 40px; text-align: left;">
                                <h1 class="text-main" style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Recordatorio de tu Cita</h1>
                                <p class="text-muted" style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">Hola,</p>
                                <p class="text-muted" style="margin: 0 0 0 0; font-size: 16px; line-height: 1.6;">Esperamos que estés teniendo una buena semana. Te escribimos para recordarte tu próxima sesión:</p>
                            </td>
                        </tr>
                        
                        <!-- Card Details -->
                        <tr>
                            <td class="mobile-padding" style="padding: 0 40px 30px 40px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="border-radius: 8px; border-left: 5px solid #d980fa;">
                                    <tr>
                                        <td style="padding: 25px;">
                                            <!-- Row 1: Cuándo -->
                                            <div style="margin-bottom: 15px;">
                                                <div class="text-muted" style="font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Cuándo</div>
                                                <div class="text-main" style="font-size: 18px; font-weight: 600; text-transform: capitalize;">${dateStr}</div>
                                            </div>
                                            <!-- Row 2: Hora -->
                                            <div style="margin-bottom: 15px;">
                                                <div class="text-muted" style="font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Hora</div>
                                                <div class="text-main" style="font-size: 18px; font-weight: 600;">${timeStr}</div>
                                            </div>
                                            <!-- Row 3: Con -->
                                            <div>
                                                <div class="text-muted" style="font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Profesional</div>
                                                <div class="text-main" style="font-size: 18px; font-weight: 600;">${therapistName}</div>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Footer Warning -->
                        <tr>
                             <td class="mobile-padding" style="padding: 0 40px 40px 40px;">
                                <p style="font-size: 14px; color: #999; margin: 0; font-style: italic; line-height: 1.5;">
                                    Recuerda que si necesitas cancelar o cambiar la cita, te agradecemos que nos avises con al menos 24 horas de antelación.
                                </p>
                             </td>
                        </tr>

                        <!-- Footer Links -->
                        <tr>
                            <td align="center" style="background-color: #fafafa; padding: 30px 20px; border-top: 1px solid #eeeeee;">
                                <p style="color: #999; font-size: 13px; margin: 0 0 8px 0;"><strong>Esencialmente Psicología</strong></p>
                                <p style="color: #999; font-size: 13px; margin: 0 0 8px 0;">Carrer del Pintor Togores, 1, 08290 Cerdanyola del Vallès, Barcelona</p>
                                <p style="margin: 0;"><a href="https://www.esencialmentepsicologia.com" style="color: #d980fa; text-decoration: none; font-weight: bold;">www.esencialmentepsicologia.com</a></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    console.log('📧 Sending Final V3 Email (Address & Logo Fix)...');

    try {
        const { data, error } = await resend.emails.send({
            from: `Esencialmente Psicología <${senderEmail}>`,
            to: emails,
            subject: 'Recordatorio de Cita - Esencialmente Psicología',
            html: htmlContent
        });

        if (error) {
            console.error('❌ Error sending test email:', error);
        } else {
            console.log('✅ Test emails sent successfully. ID:', data.id);
        }

    } catch (err) {
        console.error('❌ Exception:', err);
    }
};

sendTestEmail();
