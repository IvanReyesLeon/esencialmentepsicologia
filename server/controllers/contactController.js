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

    // 1. Guardar mensaje en la base de datos
    await createContactMessage(name, email, phone, subject, message);

    // 2. Enviar email via Nodemailer
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

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

    res.json({
      message: 'Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.'
    });
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).json({
      message: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.'
    });
  }
};
