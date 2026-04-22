const {
  getAllPricing,
  getPricingById,
  getPricingBySessionType,
  createPricing,
  updatePricing,
  deletePricing,
  hardDeletePricing
} = require('../models/pricingQueries');

// @desc    Get all pricing
// @route   GET /api/pricing
// @access  Public
exports.getAllPricing = async (req, res) => {
  try {
    const pricing = await getAllPricing();
    res.json(pricing);
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single pricing
// @route   GET /api/pricing/:id
// @access  Public
exports.getPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const pricing = await getPricingById(id);

    if (!pricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }

    res.json(pricing);
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create pricing
// @route   POST /api/pricing
// @access  Private/Admin
exports.upsertPricing = async (req, res) => {
  try {
    const { session_type, price, duration, description } = req.body;

    if (!session_type || price === undefined || duration === undefined) {
      return res.status(400).json({ message: 'El tipo de sesión, precio y duración son obligatorios' });
    }

    // --- VALIDACIÓN FUERTE ---
    const activePricing = await getPricingBySessionType(session_type);
    
    // 1. Regla de límites de cantidad (solo contamos los activos)
    const limit = session_type === 'couple' ? 2 : 1;
    if (activePricing.length >= limit) {
      return res.status(400).json({ 
        message: `Este servicio solo permite un máximo de ${limit} opción/es activa/s. Desactiva o elimina una antes de añadir otra.` 
      });
    }

    // 2. Regla de duración duplicada (contra activos)
    const isDurationDuplicate = activePricing.some(p => parseInt(p.duration) === parseInt(duration));
    if (isDurationDuplicate) {
      return res.status(400).json({ message: `Ya existe una opción ACTIVA con la duración de ${duration} minutos para este servicio` });
    }

    const pricing = await createPricing(session_type, price, duration, description || '');
    res.json(pricing);
  } catch (error) {
    console.error('Create pricing error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update pricing
// @route   PUT /api/pricing/:id
// @access  Private/Admin
exports.updatePricing = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const currentPricing = await getPricingById(id);
    if (!currentPricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }

    // --- VALIDACIÓN DE REACTIVACIÓN ---
    // Si el usuario intenta poner is_active: true en algo que estaba false
    if (updates.is_active === true && currentPricing.is_active === false) {
      const activePricing = await getPricingBySessionType(currentPricing.session_type_name);
      
      // 1. Validar límite al reactivar
      const limit = currentPricing.session_type_name === 'couple' ? 2 : 1;
      if (activePricing.length >= limit) {
        return res.status(400).json({ 
          message: `No se puede activar. Este servicio ya tiene el máximo de ${limit} opciones activas.` 
        });
      }

      // 2. Validar duración al reactivar (por si ya existe otra activa con esa duración)
      const durationToCheck = updates.duration || currentPricing.duration;
      const isDuplicate = activePricing.some(p => parseInt(p.duration) === parseInt(durationToCheck));
      if (isDuplicate) {
        return res.status(400).json({ 
          message: `No se puede activar. Ya existe otra opción activa con la duración de ${durationToCheck} minutos.` 
        });
      }
    }

    // --- VALIDACIÓN DE DURACIÓN (si cambia y está/estará activo) ---
    const willBeActive = updates.is_active !== undefined ? updates.is_active : currentPricing.is_active;
    if (updates.duration && willBeActive) {
      const activePricing = await getPricingBySessionType(currentPricing.session_type_name);
      const isDuplicate = activePricing.some(p => p.id !== parseInt(id) && parseInt(p.duration) === parseInt(updates.duration));
      if (isDuplicate) {
        return res.status(400).json({ 
          message: `Ya existe otra opción activa con la duración de ${updates.duration} minutos para este servicio` 
        });
      }
    }

    const pricing = await updatePricing(id, updates);
    res.json(pricing);
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete pricing
// @route   DELETE /api/pricing/:id
// @access  Private/Admin
exports.deletePricing = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar estado actual para decidir si es soft o hard delete
    const currentPricing = await getPricingById(id);
    if (!currentPricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }

    if (currentPricing.is_active) {
      // Si está activo, lo desactivamos y archivamos
      await deletePricing(id);
      res.json({ message: 'Precio desactivado y archivado correctamente' });
    } else {
      // Si ya estaba inactivo (archivado), lo borramos definitivamente
      await hardDeletePricing(id);
      res.json({ message: 'Precio eliminado definitivamente del historial' });
    }
  } catch (error) {
    console.error('Delete pricing error:', error);
    res.status(500).json({ message: 'Error al procesar la eliminación' });
  }
};
