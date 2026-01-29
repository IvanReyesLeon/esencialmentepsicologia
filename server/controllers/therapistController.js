const {
  getAllTherapists,
  getTherapistById,
  getTherapistBySlug,
  createTherapist,
  updateTherapist,
  deleteTherapist,
  createTherapistWithAccount,
  getUsedCalendarColors,
  getTherapistsWithoutAccount,
  createAccountForExistingTherapist,
  getHiddenTherapists,
  activateTherapist,
  therapistHasAccount,
  hideTherapist,
  deleteTherapistAccount,
  getTherapistsWithAccount,
  deleteTherapistCompletely
} = require('../models/therapistQueries');
const { Resend } = require('resend');

// Initialize Resend for welcome emails
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: Generate internal email from full name
const generateInternalEmail = (fullName) => {
  return fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z\s]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '.') // Spaces to dots
    + '@esencialmentepsicologia.com';
};

// Helper: Generate password from first name
const generatePassword = (fullName) => {
  const firstName = fullName.split(' ')[0].toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
  return firstName + '123';
};

// @desc    Get all therapists
// @route   GET /api/therapists
// @access  Public
exports.getTherapists = async (req, res) => {
  try {
    const therapists = await getAllTherapists();
    res.json(therapists);
  } catch (error) {
    console.error('Get therapists error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single therapist
// @route   GET /api/therapists/:id
// @access  Public
exports.getTherapist = async (req, res) => {
  try {
    const { id } = req.params;

    //  Intentar buscar por ID o por slug
    let therapist;
    if (isNaN(id)) {
      // Si no es un número, buscar por slug
      therapist = await getTherapistBySlug(id);
    } else {
      therapist = await getTherapistById(id);
    }

    if (!therapist || !therapist.is_active) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    res.json(therapist);
  } catch (error) {
    console.error('Get therapist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create therapist
// @route   POST /api/therapists
// @access  Private/Admin
exports.createTherapist = async (req, res) => {
  try {
    // Normalizar datos entrantes (multipart/form-data puede enviar arrays como strings)
    const therapistData = { ...req.body };

    // Asegurar que los arrays sean arrays
    if (typeof therapistData.specializations === 'string') {
      try {
        therapistData.specializations = JSON.parse(therapistData.specializations);
      } catch {
        therapistData.specializations = therapistData.specializations.split(',').map(s => s.trim());
      }
    }

    if (typeof therapistData.languages === 'string') {
      try {
        therapistData.languages = JSON.parse(therapistData.languages);
      } catch {
        therapistData.languages = therapistData.languages.split(',').map(s => s.trim());
      }
    }

    if (typeof therapistData.session_types === 'string') {
      try {
        therapistData.session_types = JSON.parse(therapistData.session_types);
      } catch {
        therapistData.session_types = therapistData.session_types.split(',').map(s => s.trim());
      }
    }

    if (typeof therapistData.education === 'string') {
      try {
        therapistData.education = JSON.parse(therapistData.education);
      } catch {
        therapistData.education = [];
      }
    }

    // Sanitize calendar_color_id
    if (therapistData.calendar_color_id === '' || therapistData.calendar_color_id === 'null' || !therapistData.calendar_color_id) {
      therapistData.calendar_color_id = null;
    } else {
      therapistData.calendar_color_id = parseInt(therapistData.calendar_color_id, 10);
    }

    // If file was uploaded, use the Cloudinary URL
    if (req.file) {
      therapistData.photo = req.file.path;
    }

    const therapist = await createTherapist(therapistData);
    res.status(201).json(therapist);
  } catch (error) {
    console.error('Create therapist error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update therapist photo
// @route   PUT /api/therapists/:id/photo
// @access  Private/Admin
exports.updateTherapistPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { photo } = req.body;

    const therapist = await updateTherapist(id, { photo });

    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    res.json(therapist);
  } catch (error) {
    console.error('Update therapist photo error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update therapist
// @route   PUT /api/therapists/:id
// @access  Private/Admin
exports.updateTherapist = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[UPDATE THERAPIST] ID: ${id}`);
    console.log('[UPDATE THERAPIST] Body:', req.body);
    console.log('[UPDATE THERAPIST] File:', req.file);

    const updateData = { ...req.body };

    // Normalizar arrays si vienen como strings
    ['specializations', 'languages', 'session_types'].forEach(field => {
      if (typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch {
          updateData[field] = updateData[field].split(',').map(s => s.trim());
        }
      }
    });

    if (typeof updateData.education === 'string') {
      try {
        updateData.education = JSON.parse(updateData.education);
      } catch {
        updateData.education = [];
      }
    }

    // Sanitize calendar_color_id
    if (updateData.calendar_color_id === '' || updateData.calendar_color_id === 'null' || !updateData.calendar_color_id) {
      updateData.calendar_color_id = null;
    } else {
      updateData.calendar_color_id = parseInt(updateData.calendar_color_id, 10);
    }

    // If file was uploaded, use the Cloudinary URL
    if (req.file) {
      updateData.photo = req.file.path;
    }

    const therapist = await updateTherapist(id, updateData);

    if (!therapist) {
      console.log('[UPDATE THERAPIST] Not found');
      return res.status(404).json({ message: 'Therapist not found' });
    }

    res.json(therapist);
  } catch (error) {
    console.error('[UPDATE THERAPIST] Error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Delete therapist
// @route   DELETE /api/therapists/:id
// @access  Private/Admin
exports.deleteTherapist = async (req, res) => {
  try {
    const { id } = req.params;

    const therapist = await deleteTherapist(id);

    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    res.json({ message: 'Therapist removed' });
  } catch (error) {
    console.error('Delete therapist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get calendar colors already in use
// @route   GET /api/therapists/colors/used
// @access  Private/Admin
exports.getUsedColors = async (req, res) => {
  try {
    const usedColors = await getUsedCalendarColors();
    res.json(usedColors);
  } catch (error) {
    console.error('Get used colors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create therapist with user account (for billing system)
// @route   POST /api/therapists/account
// @access  Private/Admin
exports.createTherapistAccount = async (req, res) => {
  try {
    const { full_name, personal_email, calendar_color_id, calendar_alias } = req.body;

    // Validaciones básicas
    if (!full_name || !personal_email) {
      return res.status(400).json({ message: 'Nombre y email personal son obligatorios' });
    }

    // Auto-generate internal email and password
    const internalEmail = generateInternalEmail(full_name);
    const password = generatePassword(full_name);

    // Determines the calendar tag (alias or first name)
    const calendarTag = calendar_alias || full_name.split(' ')[0].toLowerCase();

    const therapistData = {
      full_name,
      calendar_color_id: calendar_color_id ? parseInt(calendar_color_id, 10) : null,
      calendar_alias: calendar_alias || null
    };

    const userData = {
      email: internalEmail,
      password
    };

    const therapist = await createTherapistWithAccount(therapistData, userData);

    // Send welcome email to personal email
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Esencialmente Psicología <info@esencialmentepsicologia.com>',
          to: personal_email,
          subject: '¡Bienvenida/o al equipo de Esencialmente Psicología!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #8B5A8B;">¡Bienvenida/o al equipo!</h1>
              <p>Hola <strong>${full_name}</strong>,</p>
              <p>Ya tienes acceso al sistema de gestión de Esencialmente Psicología. Aquí tienes tus credenciales de acceso:</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>🔗 URL de acceso:</strong> <a href="https://www.esencialmentepsicologia.com/admin">www.esencialmentepsicologia.com/admin</a></p>
                <p><strong>📧 Email:</strong> ${internalEmail}</p>
                <p><strong>🔑 Contraseña temporal:</strong> ${password}</p>
              </div>

              <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbdefb;">
                <h3 style="margin: 0 0 10px 0; color: #0d47a1;">📅 ¿Cómo agendar sesiones?</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">
                  Para que el sistema detecte tus sesiones automáticamente en Google Calendar, debes incluir tu etiqueta entre barras <strong>/ /</strong> en el título del evento.
                </p>
                <p style="margin: 0; font-size: 16px;">Tu etiqueta es: <strong>${calendarTag}</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #333;">
                    Ejemplo: <code>Sesión María /${calendarTag}/</code>
                </p>
              </div>
              
              <h3 style="color: #8B5A8B;">Próximos pasos:</h3>
              <ol>
                <li><strong>Cambia tu contraseña</strong> por una personal y segura desde tu perfil.</li>
                <li><strong>Rellena tus datos personales</strong> (NIF, dirección, IBAN) para poder gestionar la facturación.</li>
                <li>¡Ya puedes empezar a registrar tus sesiones!</li>
              </ol>
              
              <p>Si tienes cualquier duda, no dudes en contactarnos.</p>
              <p>¡Bienvenida/o al equipo! 🎉</p>
              
              <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #888;">Este es un email automático del sistema de gestión de Esencialmente Psicología.</p>
            </div>
          `
        });
        console.log(`✅ Welcome email sent to ${personal_email}`);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      message: 'Terapeuta creado correctamente',
      therapist,
      credentials: {
        email: internalEmail,
        password: password
      }
    });
  } catch (error) {
    console.error('Create therapist account error:', error);
    if (error.message === 'El email ya está registrado') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al crear terapeuta: ' + error.message });
  }
};

// @desc    Get therapists that don't have a user account yet
// @route   GET /api/therapists/without-account
// @access  Private/Admin
exports.getTherapistsWithoutAccount = async (req, res) => {
  try {
    const therapists = await getTherapistsWithoutAccount();
    res.json(therapists);
  } catch (error) {
    console.error('Get therapists without account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create user account for existing therapist
// @route   POST /api/therapists/:id/account
// @access  Private/Admin
exports.createAccountForTherapist = async (req, res) => {
  try {
    const { id } = req.params;
    const { personal_email } = req.body;

    if (!personal_email) {
      return res.status(400).json({ message: 'Email personal es obligatorio' });
    }

    // Get therapist to generate credentials
    const therapistCheck = await getTherapistById(id);
    if (!therapistCheck) {
      return res.status(404).json({ message: 'Terapeuta no encontrado' });
    }

    const internalEmail = generateInternalEmail(therapistCheck.full_name);
    const password = generatePassword(therapistCheck.full_name);

    const userData = {
      email: internalEmail,
      password
    };

    const therapist = await createAccountForExistingTherapist(id, userData);

    // Send welcome email
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Esencialmente Psicología <info@esencialmentepsicologia.com>',
          to: personal_email,
          subject: '¡Bienvenida/o al equipo de Esencialmente Psicología!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #8B5A8B;">¡Bienvenida/o al equipo!</h1>
              <p>Hola <strong>${therapistCheck.full_name}</strong>,</p>
              <p>Ya tienes acceso al sistema de gestión de Esencialmente Psicología. Aquí tienes tus credenciales de acceso:</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>🔗 URL de acceso:</strong> <a href="https://www.esencialmentepsicologia.com/admin">www.esencialmentepsicologia.com/admin</a></p>
                <p><strong>📧 Email:</strong> ${internalEmail}</p>
                <p><strong>🔑 Contraseña temporal:</strong> ${password}</p>
              </div>

              <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbdefb;">
                <h3 style="margin: 0 0 10px 0; color: #0d47a1;">📅 ¿Cómo agendar sesiones?</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">
                  Para que el sistema detecte tus sesiones automáticamente en Google Calendar, debes incluir tu etiqueta entre barras <strong>/ /</strong> en el título del evento.
                </p>
                <p style="margin: 0; font-size: 16px;">Tu etiqueta es: <strong>${therapistCheck.calendar_alias || therapistCheck.full_name.split(' ')[0].toLowerCase()}</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #333;">
                    Ejemplo: <code>Sesión /${therapistCheck.calendar_alias || therapistCheck.full_name.split(' ')[0].toLowerCase()}/</code>
                </p>
              </div>
              
              <h3 style="color: #8B5A8B;">Próximos pasos:</h3>
              <ol>
                <li><strong>Cambia tu contraseña</strong> por una personal y segura desde tu perfil.</li>
                <li><strong>Rellena tus datos personales</strong> (NIF, dirección, IBAN) para poder gestionar la facturación.</li>
                <li>¡Ya puedes empezar a registrar tus sesiones!</li>
              </ol>
              
              <p>Si tienes cualquier duda, no dudes en contactarnos.</p>
              <p>¡Bienvenida/o al equipo! 🎉</p>
              
              <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #888;">Este es un email automático del sistema de gestión de Esencialmente Psicología.</p>
            </div>
          `
        });
        console.log(`✅ Welcome email sent to ${personal_email}`);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }
    }

    res.status(201).json({
      message: 'Cuenta creada correctamente',
      therapist,
      credentials: {
        email: internalEmail,
        password: password
      }
    });
  } catch (error) {
    console.error('Create account for therapist error:', error);
    if (error.message === 'El email ya está registrado' || error.message === 'Este terapeuta ya tiene una cuenta de usuario') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error: ' + error.message });
  }
};

// @desc    Get hidden therapists (is_active=false, billing-only)
// @route   GET /api/therapists/hidden
// @access  Private/Admin
exports.getHiddenTherapists = async (req, res) => {
  try {
    const therapists = await getHiddenTherapists();
    res.json(therapists);
  } catch (error) {
    console.error('Get hidden therapists error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Activate therapist (make public)
// @route   PUT /api/therapists/:id/activate
// @access  Private/Admin
exports.activateTherapistHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const therapist = await activateTherapist(id, req.body);
    res.json({ message: 'Terapeuta activado correctamente', therapist });
  } catch (error) {
    console.error('Activate therapist error:', error);
    res.status(500).json({ message: 'Error: ' + error.message });
  }
};

// @desc    Check if therapist has account
// @route   GET /api/therapists/:id/has-account
// @access  Private/Admin
exports.checkTherapistHasAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccount = await therapistHasAccount(id);
    const therapist = await getTherapistById(id);
    res.json({ hasAccount, isActive: therapist?.is_active || false });
  } catch (error) {
    console.error('Check has account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Hide therapist from public (keep account)
// @route   PUT /api/therapists/:id/hide
// @access  Private/Admin
exports.hideTherapistHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await hideTherapist(id);
    res.json({ message: 'Terapeuta ocultado de la web pública' });
  } catch (error) {
    console.error('Hide therapist error:', error);
    res.status(500).json({ message: 'Error: ' + error.message });
  }
};

// @desc    Delete only user account (keep therapist)
// @route   DELETE /api/therapists/:id/account
// @access  Private/Admin
exports.deleteTherapistAccountHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTherapistAccount(id);
    res.json({ message: 'Cuenta de facturación eliminada' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Error: ' + error.message });
  }
};

// @desc    Get therapists with accounts (for billing deletion list)
// @route   GET /api/therapists/with-account
// @access  Private/Admin
exports.getTherapistsWithAccountHandler = async (req, res) => {
  try {
    const therapists = await getTherapistsWithAccount();
    res.json(therapists);
  } catch (error) {
    console.error('Get therapists with account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete therapist completely (therapist + account)
// @route   DELETE /api/therapists/:id/complete
// @access  Private/Admin
exports.deleteTherapistCompletelyHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTherapistCompletely(id);
    res.json({ message: 'Terapeuta eliminado completamente' });
  } catch (error) {
    console.error('Delete completely error:', error);
    res.status(500).json({ message: 'Error: ' + error.message });
  }
};
