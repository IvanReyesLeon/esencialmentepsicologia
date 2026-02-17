import React, { useState, useEffect } from 'react';
import { therapistAPI, API_ROOT } from '../services/api';
import Toast from './Toast';

const TherapistsTab = ({ therapists, onRefresh }) => {
    const [toast, setToast] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState('new'); // 'new' or 'existing'
    const [hiddenTherapists, setHiddenTherapists] = useState([]);
    const [selectedHiddenId, setSelectedHiddenId] = useState('');

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState({ show: false, therapist: null, hasAccount: false });

    const [formData, setFormData] = useState({
        full_name: '',
        label: '',
        bio: '',
        experience: '',
        specializations: '',
        languages: '',
        methodology: '',
        license_number: '',
        session_types: [],
        calendar_color_id: '',
        calendar_alias: '',
        photo: null
    });
    const [photoPreview, setPhotoPreview] = useState(null);

    // Fetch hidden therapists when opening form
    useEffect(() => {
        if (showForm && !editingId) {
            therapistAPI.getHidden()
                .then(res => setHiddenTherapists(res.data))
                .catch(err => console.error('Error fetching hidden therapists:', err));
        }
    }, [showForm, editingId]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, photo: file });
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const toggleSessionType = (type) => {
        const current = formData.session_types;
        if (current.includes(type)) {
            setFormData({ ...formData, session_types: current.filter(t => t !== type) });
        } else {
            setFormData({ ...formData, session_types: [...current, type] });
        }
    };

    const [editingId, setEditingId] = useState(null);

    const handleEdit = (therapist) => {
        setFormData({
            full_name: therapist.full_name,
            label: therapist.label || '',
            bio: therapist.bio || '',
            experience: therapist.experience,
            specializations: Array.isArray(therapist.specializations) ? therapist.specializations.join(', ') : therapist.specializations || '',
            languages: Array.isArray(therapist.languages) ? therapist.languages.join(', ') : therapist.languages || '',
            methodology: therapist.methodology || '',
            education: Array.isArray(therapist.education)
                ? therapist.education.map(e => e.degree).join('\n')
                : '',
            license_number: therapist.license_number || '',
            session_types: therapist.session_types || [],
            calendar_color_id: therapist.calendar_color_id || '',
            calendar_alias: therapist.calendar_alias || '',
            photo: null // Reset photo input
        });
        setPhotoPreview(
            therapist.photo
                ? (therapist.photo.startsWith('http')
                    ? therapist.photo
                    : therapist.photo.includes('/uploads')
                        ? `${API_ROOT}${therapist.photo}`
                        : `${API_ROOT}/uploads/terapeutas/${therapist.photo}`)
                : null
        );
        setEditingId(therapist.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();

            // If activating an existing hidden therapist
            if (formMode === 'existing' && selectedHiddenId) {
                data.append('bio', formData.bio);
                data.append('experience', formData.experience);
                data.append('label', formData.label);
                data.append('specializations', formData.specializations);
                data.append('languages', formData.languages);
                data.append('methodology', formData.methodology);
                data.append('license_number', formData.license_number);
                data.append('calendar_color_id', formData.calendar_color_id);
                data.append('calendar_alias', formData.calendar_alias); // Nuevo
                data.append('session_types', JSON.stringify(formData.session_types));

                const educationArray = (formData.education || '')
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .map(degree => ({ degree, university: "", year: null }));
                data.append('education', JSON.stringify(educationArray));

                if (formData.photo) {
                    data.append('photo', formData.photo);
                }

                // Activate the hidden therapist
                await therapistAPI.activate(selectedHiddenId, data);
                setToast({ message: '✓ Terapeuta activado y visible en la web', type: 'success' });
            } else if (editingId) {
                // Editing existing
                data.append('full_name', formData.full_name);
                data.append('label', formData.label);
                data.append('bio', formData.bio);
                data.append('experience', formData.experience);
                data.append('specializations', formData.specializations);
                data.append('languages', formData.languages);
                data.append('methodology', formData.methodology);
                data.append('license_number', formData.license_number);
                data.append('calendar_color_id', formData.calendar_color_id);
                data.append('calendar_alias', formData.calendar_alias); // Nuevo
                data.append('session_types', JSON.stringify(formData.session_types));

                const educationArray = (formData.education || '')
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .map(degree => ({ degree, university: "", year: null }));
                data.append('education', JSON.stringify(educationArray));

                if (formData.photo) {
                    data.append('photo', formData.photo);
                }

                await therapistAPI.update(editingId, data);
                setToast({ message: '✓ Terapeuta actualizado correctamente', type: 'success' });
            } else {
                // Creating new
                const timestamp = Date.now();
                data.append('email', `terapeuta${timestamp}@temp.com`);
                data.append('password', `temp${timestamp}`);

                data.append('full_name', formData.full_name);
                data.append('label', formData.label);
                data.append('bio', formData.bio);
                data.append('experience', formData.experience);
                data.append('specializations', formData.specializations);
                data.append('languages', formData.languages);
                data.append('methodology', formData.methodology);
                data.append('license_number', formData.license_number);
                data.append('calendar_color_id', formData.calendar_color_id);
                data.append('calendar_alias', formData.calendar_alias); // Nuevo
                data.append('session_types', JSON.stringify(formData.session_types));

                const educationArray = (formData.education || '')
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .map(degree => ({ degree, university: "", year: null }));
                data.append('education', JSON.stringify(educationArray));

                if (formData.photo) {
                    data.append('photo', formData.photo);
                }

                await therapistAPI.create(data);
                setToast({ message: '✓ Terapeuta creado correctamente', type: 'success' });
            }

            setShowForm(false);
            setEditingId(null);
            setFormMode('new');
            setSelectedHiddenId('');
            setFormData({
                full_name: '',
                label: '',
                bio: '',
                experience: '',
                specializations: '',
                languages: '',
                methodology: '',
                education: '',
                license_number: '',
                session_types: [],
                calendar_color_id: '',
                calendar_alias: '',
                photo: null
            });
            setPhotoPreview(null);
            onRefresh();
        } catch (error) {
            console.error(error);
            setToast({ message: `Error al ${editingId ? 'actualizar' : 'crear'} terapeuta`, type: 'error' });
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormMode('new');
        setSelectedHiddenId('');
        setFormData({
            full_name: '',
            label: '',
            bio: '',
            experience: '',
            specializations: '',
            languages: '',
            methodology: '',
            education: '',
            license_number: '',
            session_types: [],
            calendar_color_id: '',
            calendar_alias: '',
            photo: null
        });
        setPhotoPreview(null);
    };

    // Smart delete - check if has account first
    const handleDeleteClick = async (therapist) => {
        try {
            const response = await therapistAPI.checkHasAccount(therapist.id);
            setDeleteDialog({
                show: true,
                therapist,
                hasAccount: response.data.hasAccount
            });
        } catch (error) {
            console.error('Error checking account:', error);
            // Fallback to simple delete
            if (window.confirm('¿Seguro que quieres eliminar este terapeuta?')) {
                try {
                    await therapistAPI.delete(therapist.id);
                    onRefresh();
                    setToast({ message: '✓ Terapeuta eliminado', type: 'success' });
                } catch (err) {
                    setToast({ message: 'Error al eliminar', type: 'error' });
                }
            }
        }
    };

    const handleDeleteConfirm = async (deleteType) => {
        const { therapist } = deleteDialog;
        try {
            if (deleteType === 'hide') {
                // Only hide from public (keep account)
                await therapistAPI.hide(therapist.id);
                setToast({ message: '✓ Terapeuta ocultado de la web (mantiene cuenta)', type: 'success' });
            } else if (deleteType === 'complete') {
                // Delete completely
                await therapistAPI.deleteCompletely(therapist.id);
                setToast({ message: '✓ Terapeuta eliminado completamente', type: 'success' });
            } else {
                // Simple delete (no account)
                await therapistAPI.delete(therapist.id);
                setToast({ message: '✓ Terapeuta eliminado', type: 'success' });
            }
            onRefresh();
        } catch (error) {
            setToast({ message: 'Error al eliminar', type: 'error' });
        } finally {
            setDeleteDialog({ show: false, therapist: null, hasAccount: false });
        }
    };

    return (
        <div className="tab-content">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* FORM VIEW */}
            {showForm ? (
                <div className="form-page-container">
                    <div className="form-header">
                        <button onClick={handleCancel} className="btn-link">← Volver a la lista</button>
                        <h2>{editingId ? '✏️ Editar Terapeuta' : '➕ Añadir Terapeuta'}</h2>
                    </div>
                    <div className="form-card">
                        {/* Mode selector - only when creating new */}
                        {!editingId && hiddenTherapists.length > 0 && (
                            <div className="mode-selector" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                <p style={{ fontWeight: '500', marginBottom: '0.75rem' }}>¿Qué quieres hacer?</p>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', border: formMode === 'new' ? '2px solid #4285F4' : '2px solid #ddd', borderRadius: '8px', backgroundColor: formMode === 'new' ? '#e8f4fd' : 'white' }}>
                                        <input
                                            type="radio"
                                            name="formMode"
                                            checked={formMode === 'new'}
                                            onChange={() => { setFormMode('new'); setSelectedHiddenId(''); }}
                                        />
                                        Crear nuevo terapeuta
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', border: formMode === 'existing' ? '2px solid #4285F4' : '2px solid #ddd', borderRadius: '8px', backgroundColor: formMode === 'existing' ? '#e8f4fd' : 'white' }}>
                                        <input
                                            type="radio"
                                            name="formMode"
                                            checked={formMode === 'existing'}
                                            onChange={() => setFormMode('existing')}
                                        />
                                        Activar terapeuta de facturación ({hiddenTherapists.length} disponibles)
                                    </label>
                                </div>

                                {/* Dropdown to select hidden therapist */}
                                {formMode === 'existing' && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Selecciona terapeuta:</label>
                                        <select
                                            value={selectedHiddenId}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setSelectedHiddenId(id);
                                                // Pre-fill name if available
                                                const selected = hiddenTherapists.find(t => t.id === parseInt(id));
                                                if (selected) {
                                                    setFormData(prev => ({ ...prev, full_name: selected.full_name }));
                                                }
                                            }}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                            required={formMode === 'existing'}
                                        >
                                            <option value="">-- Selecciona --</option>
                                            {hiddenTherapists.map(t => (
                                                <option key={t.id} value={t.id}>{t.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="therapist-form">
                            {/* Only show name field for new therapists or editing */}
                            {(formMode === 'new' || editingId) && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombre Completo *</label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Etiqueta / Cargo</label>
                                        <input
                                            type="text"
                                            value={formData.label || ''}
                                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                            placeholder="Ej: Fundadora"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Show selected therapist info if activating */}
                            {formMode === 'existing' && selectedHiddenId && (
                                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#d4edda', borderRadius: '8px' }}>
                                    <p><strong>Terapeuta seleccionado:</strong> {formData.full_name}</p>
                                    <small>Completa los datos del perfil para hacerlo visible en la web</small>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Foto de Perfil</label>
                                <input type="file" accept="image/*" onChange={handlePhotoChange} />
                                {photoPreview && (
                                    <div className="image-preview-inline" style={{ marginTop: '10px' }}>
                                        <img src={photoPreview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%' }} />
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Biografía Profesional *</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Especialidades *</label>
                                    <input
                                        type="text"
                                        value={formData.specializations}
                                        onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                                        placeholder="Separadas por comas"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Idiomas</label>
                                    <input
                                        type="text"
                                        value={formData.languages}
                                        onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                                        placeholder="Separados por comas"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Años de Experiencia *</label>
                                    <input
                                        type="number"
                                        value={formData.experience}
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nº Colegiado</label>
                                    <input
                                        type="text"
                                        value={formData.license_number}
                                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group highlight-box" style={{ backgroundColor: '#e8f4fd', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #bbdefb' }}>
                                <label style={{ color: '#0d47a1', fontWeight: 'bold' }}>🗓️ Configuración de Calendario</label>

                                <label style={{ marginTop: '10px', display: 'block' }}>Etiqueta corta (alias)</label>
                                <input
                                    type="text"
                                    value={formData.calendar_alias || ''}
                                    onChange={(e) => setFormData({ ...formData, calendar_alias: e.target.value })}
                                    placeholder="Ej: mariana (para detectar /mariana/)"
                                    style={{ marginBottom: '5px' }}
                                />
                                <small style={{ display: 'block', marginBottom: '15px', color: '#555' }}>
                                    Texto exacto entre barras /texto/ que identificará las sesiones de este terapeuta.
                                    Si se deja vacío, se usará el primer nombre.
                                </small>
                            </div>

                            <div className="form-group highlight-box">
                                <label>🎨 Color en Google Calendar</label>
                                <select
                                    value={formData.calendar_color_id || ''}
                                    onChange={(e) => setFormData({ ...formData, calendar_color_id: e.target.value })}
                                    style={{ padding: '10px', fontSize: '1rem' }}
                                >
                                    <option value="">-- Seleccionar color --</option>
                                    <option value="1" style={{ backgroundColor: '#7986cb' }}>🔵 Lavanda (Azul-lila)</option>
                                    <option value="2" style={{ backgroundColor: '#33b679' }}>🟢 Verde claro</option>
                                    <option value="3" style={{ backgroundColor: '#8e24aa' }}>🟣 Morado</option>
                                    <option value="4" style={{ backgroundColor: '#e67c73' }}>🩷 Rosa coral</option>
                                    <option value="5" style={{ backgroundColor: '#f6c026' }}>🟡 Amarillo</option>
                                    <option value="6" style={{ backgroundColor: '#f4511e' }}>🟠 Naranja</option>
                                    <option value="7" style={{ backgroundColor: '#039be5' }}>🔵 Azul claro</option>
                                    <option value="8" style={{ backgroundColor: '#616161' }}>⚫ Gris</option>
                                    <option value="9" style={{ backgroundColor: '#3f51b5' }}>🔵 Azul oscuro</option>
                                    <option value="10" style={{ backgroundColor: '#0b8043' }}>🟢 Verde oscuro</option>
                                    <option value="11" style={{ backgroundColor: '#d50000' }}>🔴 Rojo</option>
                                </select>
                                <small>Vincula a este terapeuta con sus eventos en el calendario.</small>
                            </div>

                            <div className="form-group">
                                <label>Metodología</label>
                                <textarea
                                    value={formData.methodology}
                                    onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Formación (Una por línea)</label>
                                <textarea
                                    value={formData.education}
                                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                    rows="4"
                                    placeholder="Licenciatura en Psicología&#10;Máster en Terapia"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipos de Sesión</label>
                                <div className="checkbox-group" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                    {['Individual', 'Pareja', 'Familiar', 'Grupal'].map(type => (
                                        <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.session_types.includes(type)}
                                                onChange={() => toggleSessionType(type)}
                                            />
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions-footer">
                                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary btn-large">
                                    {editingId ? '💾 Guardar Cambios' : '✨ Crear Terapeuta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                /* LIST VIEW */
                <>
                    <div className="tab-header">
                        <h2>👨‍⚕️ Gestión de Terapeutas</h2>
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            ➕ Añadir Terapeuta
                        </button>
                    </div>

                    <div className="items-list">
                        {therapists.length === 0 ? (
                            <p className="empty-state">No hay terapeutas aún</p>
                        ) : (
                            therapists.map(therapist => (
                                <div key={therapist.id} className="item-card">
                                    <div className="therapist-photo-wrapper">
                                        <div className="therapist-photo">
                                            {therapist.photo ? (
                                                <img
                                                    src={
                                                        therapist.photo.startsWith('http')
                                                            ? therapist.photo
                                                            : therapist.photo.includes('/uploads')
                                                                ? `${API_ROOT}${therapist.photo}`
                                                                : `${API_ROOT}/uploads/terapeutas/${therapist.photo}`
                                                    }
                                                    alt={therapist.full_name}
                                                />
                                            ) : (
                                                <div className="no-photo">
                                                    {therapist.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="item-info">
                                        <h3>
                                            {therapist.full_name}
                                            {therapist.label && <span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '0.8em', padding: '2px 6px', backgroundColor: '#e3f2fd', color: '#0277bd', borderRadius: '4px' }}>{therapist.label}</span>}
                                        </h3>
                                        <p className="item-meta">
                                            {therapist.specializations && Array.isArray(therapist.specializations)
                                                ? therapist.specializations.join(', ')
                                                : (therapist.specializations || 'Sin especialidades')}
                                        </p>
                                        <p className="item-detail">{therapist.experience} años de experiencia</p>
                                    </div>
                                    <div className="item-actions">
                                        <button className="btn btn-small btn-secondary" onClick={() => handleEdit(therapist)}>
                                            ✏️ Editar
                                        </button>
                                        <button className="btn btn-small btn-danger" onClick={() => handleDeleteClick(therapist)}>
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteDialog.show && (
                <div className="modal-overlay" onClick={() => setDeleteDialog({ show: false, therapist: null, hasAccount: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>🗑️ Eliminar terapeuta</h3>
                        <p style={{ marginBottom: '1.5rem' }}>
                            <strong>{deleteDialog.therapist?.full_name}</strong>
                        </p>

                        {deleteDialog.hasAccount ? (
                            <>
                                <p style={{ marginBottom: '1rem', color: '#666' }}>
                                    Este terapeuta también tiene cuenta de facturación. ¿Qué quieres hacer?
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleDeleteConfirm('hide')}
                                        style={{ textAlign: 'left', padding: '1rem' }}
                                    >
                                        👁️‍🗨️ <strong>Solo ocultar de la web</strong>
                                        <br /><small style={{ color: '#666' }}>Mantiene la cuenta de facturación</small>
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteConfirm('complete')}
                                        style={{ textAlign: 'left', padding: '1rem' }}
                                    >
                                        ⚠️ <strong>Eliminar completamente</strong>
                                        <br /><small>Web pública + facturación</small>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                                    ¿Estás seguro de que quieres eliminar este terapeuta?
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setDeleteDialog({ show: false, therapist: null, hasAccount: false })}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteConfirm('simple')}
                                    >
                                        Sí, eliminar
                                    </button>
                                </div>
                            </>
                        )}

                        <button
                            style={{ marginTop: '1rem', width: '100%' }}
                            className="btn btn-link"
                            onClick={() => setDeleteDialog({ show: false, therapist: null, hasAccount: false })}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TherapistsTab;
