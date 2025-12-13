const nodemailer = require('nodemailer');
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

    // 2. Intentar enviar email via Nodemailer (solo si hay credenciales configuradas)
    console.log('📧 Checking email credentials...');
    console.log('EMAIL_USER configured:', !!process.env.EMAIL_USER);
    console.log('EMAIL_PASS configured:', !!process.env.EMAIL_PASS);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('📧 Attempting to send email to:', process.env.CLINIC_EMAIL || 'info@esencialmentepsicologia.com');
      try {
        const transporter = nodemailer.createTransport({
          host: 'authsmtp.securemail.pro',
          port: 465,
          secure: true, // use SSL
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          connectionTimeout: 10000, // 10 seconds
          greetingTimeout: 10000,
          socketTimeout: 15000,
          logger: true, // Enable logging
          debug: true   // Enable debug output
        });

        console.log('📧 Transporter created, verifying connection...');

        // Verify connection before sending
        await transporter.verify();
        console.log('📧 SMTP connection verified successfully');

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.CLINIC_EMAIL || 'info@esencialmentepsicologia.com',
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
            <p><small>Este mensaje fue enviado desde el formulario de contacto de la web y guardado en la base de datos.</small></p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email enviado correctamente');
      } catch (emailError) {
        console.warn('No se pudo enviar el email, pero el mensaje fue guardado:', emailError.message);
      }
    } else {
      console.log('Variables de email no configuradas. Mensaje guardado en BD sin enviar email.');
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
