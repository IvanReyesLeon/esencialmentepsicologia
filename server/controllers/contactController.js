const nodemailer = require('nodemailer');

// @desc    Send contact form email
// @route   POST /api/contact
// @access  Public
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Nombre, email y mensaje son requeridos' });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // You can change this to your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CLINIC_EMAIL,
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
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.' });
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).json({ message: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.' });
  }
};
