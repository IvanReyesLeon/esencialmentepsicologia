import React, { useState, useEffect, useMemo } from 'react';
import { therapistAPI } from '../services/api';
import './AddTherapistModal.css';

// Colores predefinidos para el calendario (Google Calendar)
const CALENDAR_COLORS = [
    { id: 1, name: 'Lavanda', hex: '#7986CB' },
    { id: 2, name: 'Salvia', hex: '#33B679' },
    { id: 3, name: 'Uva', hex: '#8E24AA' },
    { id: 4, name: 'Flamingo', hex: '#E67C73' },
    { id: 5, name: 'Plátano', hex: '#F6BF26' },
    { id: 6, name: 'Mandarina', hex: '#F4511E' },
    { id: 7, name: 'Pavo real', hex: '#039BE5' },
    { id: 8, name: 'Grafito', hex: '#616161' },
    { id: 9, name: 'Arándano', hex: '#3F51B5' },
    { id: 10, name: 'Albahaca', hex: '#0B8043' },
    { id: 11, name: 'Tomate', hex: '#D50000' },
];

// Helper: Generate internal email from full name
const generateInternalEmail = (fullName) => {
    if (!fullName.trim()) return '';
    return fullName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, '')
        .trim()
        .replace(/\s+/g, '.')
        + '@esencialmentepsicologia.com';
};

// Helper: Generate password from first name
const generatePassword = (fullName) => {
    if (!fullName.trim()) return '';
    const firstName = fullName.split(' ')[0].toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    return firstName + '123';
};

const AddTherapistModal = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState('existing'); // 'existing' or 'new'
    const [therapistsWithoutAccount, setTherapistsWithoutAccount] = useState([]);
    const [selectedTherapistId, setSelectedTherapistId] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        personal_email: '',
        calendar_color_id: '',
        calendar_alias: ''
    });
    const [loading, setLoading] = useState(false);
    const [loadingTherapists, setLoadingTherapists] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [usedColors, setUsedColors] = useState([]);

    // Fetch therapists without account and used colors when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoadingTherapists(true);
            Promise.all([
                therapistAPI.getWithoutAccount(),
                therapistAPI.getUsedColors()
            ])
                .then(([therapistsRes, colorsRes]) => {
                    setTherapistsWithoutAccount(therapistsRes.data);
                    setUsedColors(colorsRes.data);
                })
                .catch(err => console.error('Error fetching data:', err))
                .finally(() => setLoadingTherapists(false));
        }
    }, [isOpen]);

    // Get selected therapist name for credential preview
    const selectedTherapist = useMemo(() => {
        return therapistsWithoutAccount.find(t => t.id === parseInt(selectedTherapistId));
    }, [therapistsWithoutAccount, selectedTherapistId]);

    // Preview name for credential generation
    const previewName = mode === 'existing'
        ? (selectedTherapist?.full_name || '')
        : formData.full_name;

    const generatedEmail = useMemo(() => generateInternalEmail(previewName), [previewName]);
    const generatedPassword = useMemo(() => generatePassword(previewName), [previewName]);

    // Filter available colors
    const availableColors = useMemo(() => {
        return CALENDAR_COLORS.filter(color => !usedColors.includes(color.id));
    }, [usedColors]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (mode === 'existing') {
                // Create account for existing therapist
                if (!selectedTherapistId) {
                    setError('Selecciona un terapeuta');
                    setLoading(false);
                    return;
                }
                await therapistAPI.createAccountForExisting(selectedTherapistId, {
                    personal_email: formData.personal_email
                });
                setSuccess(`✅ Cuenta creada para ${selectedTherapist?.full_name}. Se ha enviado email de bienvenida.`);
            } else {
                // Create new therapist (billing only)
                await therapistAPI.createAccount({
                    full_name: formData.full_name,
                    personal_email: formData.personal_email,
                    calendar_color_id: formData.calendar_color_id,
                    calendar_alias: formData.calendar_alias // Nuevo
                });
                setSuccess(`✅ Terapeuta "${formData.full_name}" creado (solo facturación). Se ha enviado email de bienvenida.`);
            }

            // Reset form after short delay to show success
            setTimeout(() => {
                onSuccess?.();
                onClose();
                resetForm();
            }, 2000);
        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.message || 'Error al crear la cuenta');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setMode('existing');
        setSelectedTherapistId('');
        setFormData({ full_name: '', personal_email: '', calendar_color_id: '', calendar_alias: '' });
        setError('');
        setSuccess('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content add-therapist-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Añadir terapeuta al sistema de facturación</h2>
                    <button className="modal-close" onClick={handleClose}>×</button>
                </div>

                {/* Mode selector */}
                <div className="mode-selector">
                    <label className={`mode-option ${mode === 'existing' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="mode"
                            value="existing"
                            checked={mode === 'existing'}
                            onChange={() => setMode('existing')}
                        />
                        <span>Terapeuta existente (ya en web)</span>
                    </label>
                    <label className={`mode-option ${mode === 'new' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="mode"
                            value="new"
                            checked={mode === 'new'}
                            onChange={() => setMode('new')}
                        />
                        <span>Nuevo (solo facturación)</span>
                    </label>
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === 'existing' ? (
                        /* EXISTING THERAPIST MODE */
                        <div className="form-group">
                            <label htmlFor="therapist">Selecciona terapeuta *</label>
                            {loadingTherapists ? (
                                <p className="loading-text">Cargando terapeutas...</p>
                            ) : therapistsWithoutAccount.length === 0 ? (
                                <p className="no-data-text">Todos los terapeutas ya tienen cuenta</p>
                            ) : (
                                <select
                                    id="therapist"
                                    value={selectedTherapistId}
                                    onChange={(e) => setSelectedTherapistId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Selecciona --</option>
                                    {therapistsWithoutAccount.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.full_name} {t.is_active ? '(en web)' : '(oculto)'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ) : (
                        /* NEW THERAPIST MODE */
                        <>
                            <div className="form-group">
                                <label htmlFor="full_name">Nombre completo *</label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="Ej: María García López"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="calendar_alias">Etiqueta calendario (para detectar sesiones /nombre/)</label>
                                <input
                                    type="text"
                                    id="calendar_alias"
                                    name="calendar_alias"
                                    value={formData.calendar_alias}
                                    onChange={handleChange}
                                    placeholder="Ej: mariana (para /mariana/)"
                                />
                                <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                                    Si lo dejas vacío, se usará el primer nombre.
                                </small>
                            </div>

                            <div className="form-group">
                                <label>Color del calendario</label>
                                {availableColors.length > 0 ? (
                                    <div className="color-picker">
                                        {availableColors.map(color => (
                                            <button
                                                key={color.id}
                                                type="button"
                                                className={`color-option ${formData.calendar_color_id === String(color.id) ? 'selected' : ''}`}
                                                style={{ backgroundColor: color.hex }}
                                                onClick={() => setFormData(prev => ({ ...prev, calendar_color_id: String(color.id) }))}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data-text">Todos los colores están en uso</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Credentials preview */}
                    {previewName.trim() && (
                        <div className="generated-credentials">
                            <p><strong>📧 Email de acceso:</strong> {generatedEmail}</p>
                            <p><strong>🔑 Contraseña:</strong> {generatedPassword}</p>
                            <small>Se enviarán automáticamente al email personal</small>
                        </div>
                    )}

                    {/* Personal email (always shown) */}
                    <div className="form-group">
                        <label htmlFor="personal_email">Email personal (para enviar credenciales) *</label>
                        <input
                            type="email"
                            id="personal_email"
                            name="personal_email"
                            value={formData.personal_email}
                            onChange={handleChange}
                            placeholder="Ej: maria.personal@gmail.com"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || (mode === 'existing' && therapistsWithoutAccount.length === 0)}>
                            {loading ? 'Creando...' : 'Crear Cuenta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTherapistModal;
