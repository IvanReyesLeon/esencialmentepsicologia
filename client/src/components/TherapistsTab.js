import React, { useState } from 'react';
import { therapistAPI, API_ROOT } from '../services/api';
import Toast from './Toast';

const TherapistsTab = ({ therapists, onRefresh }) => {
    const [toast, setToast] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        experience: '',
        specializations: '',
        languages: '',
        methodology: '',
        license_number: '',
        session_types: [],
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            const timestamp = Date.now();
            data.append('email', `terapeuta${timestamp}@temp.com`);
            data.append('password', `temp${timestamp}`);
            data.append('full_name', formData.full_name);
            data.append('bio', formData.bio);
            data.append('experience', formData.experience);
            data.append('specializations', formData.specializations);
            data.append('languages', formData.languages);
            data.append('methodology', formData.methodology);
            data.append('license_number', formData.license_number);
            data.append('session_types', JSON.stringify(formData.session_types));
            if (formData.photo) {
                data.append('photo', formData.photo);
            }

            await therapistAPI.create(data);
            setToast({ message: '✓ Terapeuta creado correctamente', type: 'success' });
            setShowForm(false);
            setFormData({
                full_name: '',
                bio: '',
                experience: '',
                specializations: '',
                languages: '',
                methodology: '',
                license_number: '',
                session_types: [],
                photo: null
            });
            setPhotoPreview(null);
            onRefresh();
        } catch (error) {
            setToast({ message: 'Error al crear terapeuta', type: 'error' });
        }
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

            <div className="tab-header">
                <h2>👨‍⚕️ Gestión de Terapeutas</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '✕ Cancelar' : '➕ Añadir Terapeuta'}
                </button>
            </div>

            {showForm && (
                <div className="form-section">
                    <h3>Nuevo Terapeuta</h3>
                    <form onSubmit={handleSubmit} className="therapist-form">
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
                            <label>Foto</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                            />
                            {photoPreview && (
                                <div className="image-preview-inline">
                                    <img src={photoPreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginTop: '10px' }} />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Biografía Profesional *</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows="5"
                                required
                                placeholder="Descripción profesional del terapeuta..."
                            />
                            <small>Esta descripción aparecerá en la página pública</small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Especialidades *</label>
                                <input
                                    type="text"
                                    value={formData.specializations}
                                    onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                                    placeholder="EMDR, Ansiedad, Depresión"
                                    required
                                />
                                <small>Separar con comas</small>
                            </div>
                            <div className="form-group">
                                <label>Idiomas</label>
                                <input
                                    type="text"
                                    value={formData.languages}
                                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                                    placeholder="Español, Catalán, Inglés"
                                />
                                <small>Separar con comas</small>
                            </div>
                        </div>

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

                        <div className="form-row">
                            <div className="form-group">
                                <label>Metodología</label>
                                <input
                                    type="text"
                                    value={formData.methodology}
                                    onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                                    placeholder="Terapia cognitivo-conductual, sistémica..."
                                />
                                <small>Enfoque terapéutico principal</small>
                            </div>
                            <div className="form-group">
                                <label>Número de Colegiado</label>
                                <input
                                    type="text"
                                    value={formData.license_number}
                                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                    placeholder="12345"
                                />
                                <small>Número de registro profesional</small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Tipos de Sesión *</label>
                            <div className="checkbox-group">
                                {['Individual', 'Pareja', 'Familiar', 'Grupal'].map(type => (
                                    <label key={type} className="checkbox-label">
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

                        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn btn-primary">
                                ✅ Crear Terapeuta
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                                ✕ Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="items-list">
                {therapists.length === 0 ? (
                    <p className="empty-state">No hay terapeutas aún</p>
                ) : (
                    therapists.map(therapist => (
                        <div key={therapist.id} className="item-card">
                            <div className="therapist-photo-wrapper">
                                <div className="therapist-photo">
                                    {therapist.photo ? (
                                        <img src={`${API_ROOT}/uploads/terapeutas/${therapist.photo}`} alt={therapist.full_name} />
                                    ) : (
                                        <div className="no-photo">
                                            {therapist.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="item-info">
                                <h3>{therapist.full_name}</h3>
                                <p className="item-meta">
                                    {therapist.specializations && Array.isArray(therapist.specializations)
                                        ? therapist.specializations.join(', ')
                                        : (therapist.specializations || 'Sin especialidades')}
                                </p>
                                <p className="item-detail">{therapist.experience} años de experiencia</p>
                            </div>
                            <div className="item-actions">
                                <button className="btn btn-small btn-danger" onClick={() => handleDelete(therapist.id)}>
                                    🗑️ Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TherapistsTab;
