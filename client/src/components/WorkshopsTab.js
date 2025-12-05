import React, { useState, useEffect } from 'react';
import { workshopAPI, API_ROOT } from '../services/api';
import Toast from './Toast';

const WorkshopsTab = ({ workshops: initialWorkshops, onRefresh }) => {
    const [workshops, setWorkshops] = useState(initialWorkshops || []);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        price: '',
        location: '',
        max_participants: '',
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
        });
        setImages([]);
        setImagePreview([]);
        setEditingId(null);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);

        // Create previews
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

        // Add images
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
        });
        setEditingId(workshop.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este taller?')) return;

        try {
            await workshopAPI.delete(id);
            setToast({ message: 'Taller eliminado', type: 'success' });
            onRefresh();
        } catch (error) {
            console.error('Error deleting workshop:', error);
            setToast({ message: 'Error al eliminar', type: 'error' });
        }
    };

    const toggleVisibility = async (workshop) => {
        const newStatus = !workshop.is_active;

        // Optimistic update
        setWorkshops(prev =>
            prev.map(w => w.id === workshop.id ? { ...w, is_active: newStatus } : w)
        );

        try {
            await workshopAPI.update(workshop.id, { is_active: newStatus });
            setToast({
                message: newStatus ? 'Taller visible en la web' : 'Taller oculto',
                type: 'success'
            });
        } catch (error) {
            // Revert on error
            setWorkshops(prev =>
                prev.map(w => w.id === workshop.id ? { ...w, is_active: !newStatus } : w)
            );
            setToast({ message: 'Error al cambiar visibilidad', type: 'error' });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

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
                                        src={`${API_ROOT}/uploads/talleres/${workshop.images[0].image_url}`}
                                        alt={workshop.title}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="placeholder-image">🎓</div>
                                )}
                            </div>

                            <div className="workshop-info">
                                <h3>{workshop.title}</h3>
                                <div className="workshop-meta">
                                    <span>📅 {formatDate(workshop.start_date)}</span>
                                    <span>💰 {workshop.price}€</span>
                                </div>
                                {workshop.location && <p className="workshop-location">📍 {workshop.location}</p>}
                            </div>

                            <div className="workshop-actions">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={workshop.is_active}
                                        onChange={() => toggleVisibility(workshop)}
                                    />
                                    <span className="slider"></span>
                                </label>
                                <button className="btn-icon" onClick={() => handleEdit(workshop)} title="Editar">
                                    ✏️
                                </button>
                                <button className="btn-icon danger" onClick={() => handleDelete(workshop.id)} title="Eliminar">
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
