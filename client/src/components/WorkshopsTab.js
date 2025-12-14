import React, { useState, useEffect } from 'react';
import { workshopAPI, API_ROOT } from '../services/api';
import Toast from './Toast';

const WorkshopsTab = ({ workshops: initialWorkshops, onRefresh }) => {
    const [workshops, setWorkshops] = useState(initialWorkshops || []);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [viewingRegistrations, setViewingRegistrations] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualFormData, setManualFormData] = useState({ name: '', email: '', phone: '', notes: '' });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        price: '',
        location: '',
        max_participants: '',
        allow_registration: true,
        show_attendees_count: false,
        is_clickable: true,
        manual_attendees: 0,
    });
    const [images, setImages] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);

    useEffect(() => {
        if (initialWorkshops) {
            setWorkshops(initialWorkshops);
        }
    }, [initialWorkshops]);

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            start_date: '',
            end_date: '',
            price: '',
            location: '',
            max_participants: '',
            allow_registration: true,
            show_attendees_count: false,
            is_clickable: true,
            manual_attendees: 0,
        });
        setImages([]);
        setImagePreview([]);
        setEditingId(null);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreview(previews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('start_date', formData.start_date);
        if (formData.end_date) data.append('end_date', formData.end_date);
        data.append('price', formData.price);
        if (formData.location) data.append('location', formData.location);
        if (formData.max_participants) data.append('max_participants', formData.max_participants);
        data.append('allow_registration', formData.allow_registration);
        data.append('show_attendees_count', formData.show_attendees_count);
        data.append('is_clickable', formData.is_clickable);
        data.append('manual_attendees', formData.manual_attendees || 0);

        images.forEach(img => data.append('images', img));

        try {
            if (editingId) {
                await workshopAPI.update(editingId, data);
                setToast({ message: 'Taller actualizado correctamente', type: 'success' });
            } else {
                await workshopAPI.create(data);
                setToast({ message: 'Taller creado correctamente', type: 'success' });
            }
            resetForm();
            setShowForm(false);
            onRefresh();
        } catch (error) {
            console.error('Error saving workshop:', error);
            setToast({ message: 'Error al guardar el taller', type: 'error' });
        }
    };

    const handleEdit = (workshop) => {
        setFormData({
            title: workshop.title || '',
            description: workshop.description || '',
            start_date: workshop.start_date ? workshop.start_date.split('T')[0] : '',
            end_date: workshop.end_date ? workshop.end_date.split('T')[0] : '',
            price: workshop.price || '',
            location: workshop.location || '',
            max_participants: workshop.max_participants || '',
            allow_registration: workshop.allow_registration !== false,
            show_attendees_count: workshop.show_attendees_count || false,
            is_clickable: workshop.is_clickable !== false,
            manual_attendees: workshop.manual_attendees || 0,
        });
        setEditingId(workshop.id);
        setShowForm(true);
    };

    const handleDelete = async (id, permanent = false) => {
        const message = permanent
            ? '⚠️ ELIMINACIÓN PERMANENTE: ¿Estás seguro? Esta acción no se puede deshacer.'
            : '¿Desactivar este taller? (quedará oculto pero no se eliminará)';

        if (!window.confirm(message)) return;

        try {
            if (permanent) {
                await workshopAPI.deletePermanently(id);
                setToast({ message: 'Taller eliminado permanentemente', type: 'success' });
            } else {
                await workshopAPI.delete(id);
                setToast({ message: 'Taller desactivado', type: 'success' });
            }
            onRefresh();
        } catch (error) {
            console.error('Error deleting workshop:', error);
            setToast({ message: 'Error al eliminar', type: 'error' });
        }
    };

    const toggleField = async (workshop, field) => {
        const newValue = !workshop[field];

        setWorkshops(prev =>
            prev.map(w => w.id === workshop.id ? { ...w, [field]: newValue } : w)
        );

        try {
            await workshopAPI.update(workshop.id, { [field]: newValue });
            const messages = {
                is_active: newValue ? 'Taller visible en la web' : 'Taller oculto',
                allow_registration: newValue ? 'Inscripciones habilitadas' : 'Inscripciones deshabilitadas',
                show_attendees_count: newValue ? 'Contador visible' : 'Contador oculto',
                is_clickable: newValue ? 'Taller clickeable' : 'Taller no clickeable',
            };
            setToast({ message: messages[field] || 'Actualizado', type: 'success' });
        } catch (error) {
            setWorkshops(prev =>
                prev.map(w => w.id === workshop.id ? { ...w, [field]: !newValue } : w)
            );
            setToast({ message: 'Error al actualizar', type: 'error' });
        }
    };

    const loadRegistrations = async (workshopId) => {
        try {
            const response = await workshopAPI.getRegistrations(workshopId);
            setRegistrations(response.data);
            setViewingRegistrations(workshopId);
        } catch (error) {
            console.error('Error loading registrations:', error);
            setToast({ message: 'Error al cargar inscripciones', type: 'error' });
        }
    };

    const handleAddManualRegistration = async (e) => {
        e.preventDefault();
        if (!manualFormData.name) {
            setToast({ message: 'El nombre es obligatorio', type: 'error' });
            return;
        }

        try {
            await workshopAPI.addManualRegistration(viewingRegistrations, manualFormData);
            setToast({ message: 'Inscripción añadida', type: 'success' });
            setManualFormData({ name: '', email: '', phone: '', notes: '' });
            setShowManualForm(false);
            loadRegistrations(viewingRegistrations);
        } catch (error) {
            console.error('Error adding registration:', error);
            setToast({ message: 'Error al añadir inscripción', type: 'error' });
        }
    };

    const handleDeleteRegistration = async (registrationId) => {
        if (!window.confirm('¿Eliminar esta inscripción?')) return;

        try {
            await workshopAPI.deleteRegistration(registrationId);
            setToast({ message: 'Inscripción eliminada', type: 'success' });
            loadRegistrations(viewingRegistrations);
        } catch (error) {
            console.error('Error deleting registration:', error);
            setToast({ message: 'Error al eliminar', type: 'error' });
        }
    };

    const handleUpdateRegistrationStatus = async (registrationId, status) => {
        try {
            await workshopAPI.updateRegistration(registrationId, { status });
            setToast({ message: 'Estado actualizado', type: 'success' });
            loadRegistrations(viewingRegistrations);
        } catch (error) {
            console.error('Error updating status:', error);
            setToast({ message: 'Error al actualizar', type: 'error' });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getTotalAttendees = (workshop) => {
        const online = parseInt(workshop.registration_count) || 0;
        const manual = parseInt(workshop.manual_attendees) || 0;
        return online + manual;
    };

    const currentWorkshop = workshops.find(w => w.id === viewingRegistrations);

    // Modal de inscripciones
    if (viewingRegistrations) {
        return (
            <div className="workshops-tab">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                <div className="tab-header">
                    <h2>👥 Inscripciones - {currentWorkshop?.title}</h2>
                    <button className="btn btn-secondary" onClick={() => setViewingRegistrations(null)}>
                        ← Volver a Talleres
                    </button>
                </div>

                <div className="registrations-summary">
                    <div className="stat-card">
                        <span className="stat-number">{registrations.filter(r => r.status !== 'cancelled').length}</span>
                        <span className="stat-label">Online</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{currentWorkshop?.manual_attendees || 0}</span>
                        <span className="stat-label">Presencial</span>
                    </div>
                    <div className="stat-card highlight">
                        <span className="stat-number">{getTotalAttendees(currentWorkshop)}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    {currentWorkshop?.max_participants && (
                        <div className="stat-card">
                            <span className="stat-number">{currentWorkshop.max_participants - getTotalAttendees(currentWorkshop)}</span>
                            <span className="stat-label">Disponibles</span>
                        </div>
                    )}
                </div>

                <div className="registrations-actions">
                    <button className="btn btn-primary" onClick={() => setShowManualForm(!showManualForm)}>
                        {showManualForm ? '✕ Cancelar' : '➕ Añadir inscripción manual'}
                    </button>
                </div>

                {showManualForm && (
                    <form onSubmit={handleAddManualRegistration} className="manual-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    value={manualFormData.name}
                                    onChange={(e) => setManualFormData({ ...manualFormData, name: e.target.value })}
                                    placeholder="Nombre completo"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={manualFormData.email}
                                    onChange={(e) => setManualFormData({ ...manualFormData, email: e.target.value })}
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    value={manualFormData.phone}
                                    onChange={(e) => setManualFormData({ ...manualFormData, phone: e.target.value })}
                                    placeholder="600 123 456"
                                />
                            </div>
                            <div className="form-group">
                                <label>Notas</label>
                                <input
                                    type="text"
                                    value={manualFormData.notes}
                                    onChange={(e) => setManualFormData({ ...manualFormData, notes: e.target.value })}
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">✅ Añadir</button>
                    </form>
                )}

                <div className="registrations-list">
                    {registrations.length === 0 ? (
                        <p className="no-items">No hay inscripciones online todavía</p>
                    ) : (
                        <table className="registrations-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th>Tipo</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map(reg => (
                                    <tr key={reg.id} className={reg.status === 'cancelled' ? 'cancelled' : ''}>
                                        <td>{reg.name}</td>
                                        <td>{reg.email || '-'}</td>
                                        <td>{reg.phone || '-'}</td>
                                        <td>{reg.is_manual ? '🏢 Presencial' : '🌐 Online'}</td>
                                        <td>
                                            <select
                                                value={reg.status}
                                                onChange={(e) => handleUpdateRegistrationStatus(reg.id, e.target.value)}
                                                className={`status-select ${reg.status}`}
                                            >
                                                <option value="pending">⏳ Pendiente</option>
                                                <option value="confirmed">✅ Confirmado</option>
                                                <option value="cancelled">❌ Cancelado</option>
                                            </select>
                                        </td>
                                        <td>{formatDate(reg.created_at)}</td>
                                        <td>
                                            <button
                                                className="btn-icon danger"
                                                onClick={() => handleDeleteRegistration(reg.id)}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="workshops-tab">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="tab-header">
                <h2>🎓 Gestión de Talleres</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                >
                    {showForm ? '✕ Cancelar' : '➕ Añadir Taller'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="workshop-form">
                    <h3>{editingId ? '✏️ Editar Taller' : '➕ Nuevo Taller'}</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Título del Taller *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej: Mindfulness para el Estrés"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Precio (€) *</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="45"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Descripción *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descripción completa del taller..."
                            rows="4"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha de Inicio *</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Fecha de Fin (opcional)</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Ubicación</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Ej: Barcelona, Online, etc."
                            />
                        </div>
                        <div className="form-group">
                            <label>Máx. Participantes</label>
                            <input
                                type="number"
                                value={formData.max_participants}
                                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                                placeholder="Ej: 12"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Inscripciones manuales (presenciales)</label>
                            <input
                                type="number"
                                value={formData.manual_attendees}
                                onChange={(e) => setFormData({ ...formData, manual_attendees: e.target.value })}
                                placeholder="0"
                                min="0"
                            />
                            <small>Personas inscritas directamente en el centro</small>
                        </div>
                    </div>

                    <div className="form-section">
                        <h4>⚙️ Opciones de visibilidad</h4>
                        <div className="toggle-options">
                            <label className="toggle-option">
                                <input
                                    type="checkbox"
                                    checked={formData.allow_registration}
                                    onChange={(e) => setFormData({ ...formData, allow_registration: e.target.checked })}
                                />
                                <span>Permitir inscripciones online</span>
                            </label>
                            <label className="toggle-option">
                                <input
                                    type="checkbox"
                                    checked={formData.show_attendees_count}
                                    onChange={(e) => setFormData({ ...formData, show_attendees_count: e.target.checked })}
                                />
                                <span>Mostrar contador de inscritos en la web</span>
                            </label>
                            <label className="toggle-option">
                                <input
                                    type="checkbox"
                                    checked={formData.is_clickable}
                                    onChange={(e) => setFormData({ ...formData, is_clickable: e.target.checked })}
                                />
                                <span>Permitir ver detalles (clickeable)</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Imágenes (opcional, máx. 5)</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                        />
                        {imagePreview.length > 0 && (
                            <div className="image-previews">
                                {imagePreview.map((src, idx) => (
                                    <img key={idx} src={src} alt={`Preview ${idx + 1}`} className="preview-img" />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            {editingId ? '💾 Guardar Cambios' : '✅ Crear Taller'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => { resetForm(); setShowForm(false); }}
                        >
                            ✕ Cancelar
                        </button>
                    </div>
                </form>
            )}

            <div className="workshops-grid">
                {workshops.length === 0 ? (
                    <p className="no-items">No hay talleres creados. ¡Crea el primero!</p>
                ) : (
                    workshops.map(workshop => (
                        <div key={workshop.id} className={`workshop-card ${!workshop.is_active ? 'inactive' : ''}`}>
                            <div className="workshop-image">
                                {workshop.images && workshop.images.length > 0 && workshop.images[0].image_url ? (
                                    <img
                                        src={workshop.images[0].image_url.startsWith('http')
                                            ? workshop.images[0].image_url
                                            : `${API_ROOT}/uploads/talleres/${workshop.images[0].image_url}`}
                                        alt={workshop.title}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="placeholder-image">🎓</div>
                                )}
                                <div className="workshop-badges">
                                    {!workshop.is_active && <span className="badge inactive">Oculto</span>}
                                    {!workshop.is_clickable && <span className="badge no-click">No clickeable</span>}
                                    {!workshop.allow_registration && <span className="badge no-reg">Sin inscr.</span>}
                                </div>
                            </div>

                            <div className="workshop-info">
                                <h3>{workshop.title}</h3>
                                <div className="workshop-meta">
                                    <span>📅 {formatDate(workshop.start_date)}</span>
                                    <span>💰 {workshop.price}€</span>
                                </div>
                                {workshop.location && <p className="workshop-location">📍 {workshop.location}</p>}
                                <div className="workshop-stats">
                                    <span>👥 {getTotalAttendees(workshop)} inscritos</span>
                                    {workshop.max_participants && (
                                        <span>/ {workshop.max_participants} plazas</span>
                                    )}
                                </div>
                            </div>

                            <div className="workshop-toggles">
                                <label className="mini-toggle" title="Visible en web">
                                    <span>👁️</span>
                                    <input
                                        type="checkbox"
                                        checked={workshop.is_active}
                                        onChange={() => toggleField(workshop, 'is_active')}
                                    />
                                    <span className="slider-mini"></span>
                                </label>
                                <label className="mini-toggle" title="Permitir click">
                                    <span>👆</span>
                                    <input
                                        type="checkbox"
                                        checked={workshop.is_clickable}
                                        onChange={() => toggleField(workshop, 'is_clickable')}
                                    />
                                    <span className="slider-mini"></span>
                                </label>
                                <label className="mini-toggle" title="Inscripciones">
                                    <span>📝</span>
                                    <input
                                        type="checkbox"
                                        checked={workshop.allow_registration}
                                        onChange={() => toggleField(workshop, 'allow_registration')}
                                    />
                                    <span className="slider-mini"></span>
                                </label>
                                <label className="mini-toggle" title="Mostrar contador">
                                    <span>🔢</span>
                                    <input
                                        type="checkbox"
                                        checked={workshop.show_attendees_count}
                                        onChange={() => toggleField(workshop, 'show_attendees_count')}
                                    />
                                    <span className="slider-mini"></span>
                                </label>
                            </div>

                            <div className="workshop-actions">
                                <button
                                    className="btn-icon"
                                    onClick={() => loadRegistrations(workshop.id)}
                                    title="Ver inscripciones"
                                >
                                    👥
                                </button>
                                <button className="btn-icon" onClick={() => handleEdit(workshop)} title="Editar">
                                    ✏️
                                </button>
                                <button
                                    className="btn-icon warning"
                                    onClick={() => handleDelete(workshop.id, false)}
                                    title="Desactivar"
                                >
                                    🚫
                                </button>
                                <button
                                    className="btn-icon danger"
                                    onClick={() => handleDelete(workshop.id, true)}
                                    title="Eliminar permanentemente"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WorkshopsTab;
