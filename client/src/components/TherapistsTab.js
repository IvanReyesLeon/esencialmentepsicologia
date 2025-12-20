import React, { useState } from 'react';
import { therapistAPI, API_ROOT } from '../services/api';
import Toast from './Toast';

const TherapistsTab = ({ therapists, onRefresh }) => {
    const [toast, setToast] = useState(null);
    const [showForm, setShowForm] = useState(false);
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
        photo: null
    });
    const [photoPreview, setPhotoPreview] = useState(null);

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

            if (!editingId) {
                const timestamp = Date.now();
                data.append('email', `terapeuta${timestamp}@temp.com`);
                data.append('password', `temp${timestamp}`);
            }

            data.append('full_name', formData.full_name);
            // Append label even if empty to allow clearing it
            data.append('label', formData.label);
            data.append('bio', formData.bio);
            data.append('experience', formData.experience);
            data.append('specializations', formData.specializations);
            data.append('languages', formData.languages);
            data.append('methodology', formData.methodology);
            data.append('license_number', formData.license_number);
            data.append('calendar_color_id', formData.calendar_color_id);
            data.append('session_types', JSON.stringify(formData.session_types));

            // Process education: split by newline and create objects
            const educationArray = formData.education
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(degree => ({ degree, university: "", year: null }));

            data.append('education', JSON.stringify(educationArray));

            if (formData.photo) {
                data.append('photo', formData.photo);
            }

            if (editingId) {
                await therapistAPI.update(editingId, data);
                setToast({ message: '✓ Terapeuta actualizado correctamente', type: 'success' });
            } else {
                await therapistAPI.create(data);
                setToast({ message: '✓ Terapeuta creado correctamente', type: 'success' });
            }

            setShowForm(false);
            setEditingId(null);
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
            photo: null
        });
        setPhotoPreview(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Seguro que quieres eliminar este terapeuta?')) {
            try {
                await therapistAPI.delete(id);
                onRefresh();
                setToast({ message: '✓ Terapeuta eliminado', type: 'success' });
            } catch (error) {
                setToast({ message: 'Error al eliminar', type: 'error' });
            }
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
                        <h2>{editingId ? '✏️ Editar Terapeuta' : '➕ Nuevo Terapeuta'}</h2>
                    </div>
                    <div className="form-card">
                        <form onSubmit={handleSubmit} className="therapist-form">
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

                            <div className="form-group highlight-box">
                                <label>🎨 Color en Google Calendar *</label>
                                <select
                                    value={formData.calendar_color_id || ''}
                                    onChange={(e) => setFormData({ ...formData, calendar_color_id: e.target.value })}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    <option value="1">Lavanda (1)</option>
                                    <option value="2">Salvia (2)</option>
                                    <option value="3">Uva (3)</option>
                                    <option value="4">Flamenco (4)</option>
                                    <option value="5">Banana (5)</option>
                                    <option value="6">Mandarina (6)</option>
                                    <option value="7">Pavo Real (7)</option>
                                    <option value="8">Grafito (8)</option>
                                    <option value="9">Arándano (9)</option>
                                    <option value="10">Albahaca (10)</option>
                                    <option value="11">Tomate (11)</option>
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
                                        <button className="btn btn-small btn-danger" onClick={() => handleDelete(therapist.id)}>
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TherapistsTab;
