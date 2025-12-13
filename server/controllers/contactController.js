const { Resend } = require('resend');
const { createContactMessage } = require('../models/contactQueries');

// @desc    Send contact form email and save to database
// @route   POST /api/contact
// @access  Public
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Nombre, email y mensaje son requeridos' });
    }

    // 1. Intentar guardar mensaje en la base de datos (no crítico)
    try {
      await createContactMessage(name, email, phone, subject, message);
      console.log('Mensaje guardado en la base de datos');
    } catch (dbError) {
      console.warn('No se pudo guardar en BD, pero continuará con el envío de email:', dbError.message);
    }

    // 2. Intentar enviar email via Resend API (solo si hay API key configurada)
    console.log('📧 Checking Resend API key...');
    console.log('RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);

    if (process.env.RESEND_API_KEY) {
      const clinicEmail = process.env.CLINIC_EMAIL || 'info@esencialmentepsicologia.com';
      console.log('📧 Attempting to send email to:', clinicEmail);

      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
          from: 'Esencialmente Psicología <contacto@esencialmentepsicologia.com>',
          to: [clinicEmail],
          replyTo: email,
          subject: `Nuevo mensaje de contacto: ${subject || 'Sin asunto'}`,
          html: `
            <h3>Nuevo mensaje de contacto - Esencialmente Psicología</h3>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
            <p><strong>Asunto:</strong> ${subject || 'Sin asunto'}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Este mensaje fue enviado desde el formulario de contacto de la web.</small></p>
          `
        });

        if (error) {
          console.warn('Error de Resend:', error);
        } else {
          console.log('📧 Email enviado correctamente via Resend. ID:', data.id);
        }
      } catch (emailError) {
        console.warn('No se pudo enviar el email, pero el mensaje fue guardado:', emailError.message);
      }
    } else {
      console.log('RESEND_API_KEY no configurada. Mensaje guardado en BD sin enviar email.');
    }

    res.json({
      message: 'Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.'
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({
      message: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.'
    });
  }
};
