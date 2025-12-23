import React, { useState, useEffect } from 'react';
import { API_ROOT } from '../services/api';
import './PatientsTab.css';

const API_URL = `${API_ROOT}/api`;

const PatientsTab = ({ user }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientSessions, setPatientSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ email: '', phone: '', notes: '', preferred_payment_method: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async (searchTerm = '') => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const url = searchTerm
                ? `${API_URL}/admin/sync/patients?search=${encodeURIComponent(searchTerm)}&limit=100`
                : `${API_URL}/admin/sync/patients?limit=100`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPatients(data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPatients(search);
    };

    const selectPatient = async (patient) => {
        setSelectedPatient(patient);
        setIsEditing(false);
        setEditForm({
            email: patient.email || '',
            phone: patient.phone || '',
            notes: patient.notes || '',
            preferred_payment_method: patient.preferred_payment_method || ''
        });
        setLoadingSessions(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/sync/patients/${patient.id}/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPatientSessions(data.sessions || []);
        } catch (error) {
            console.error('Error fetching patient sessions:', error);
            setPatientSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleEditChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const savePatient = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/sync/patients/${selectedPatient.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            const data = await res.json();
            if (data.success) {
                // Update local state
                setSelectedPatient(data.patient);
                setPatients(prev => prev.map(p =>
                    p.id === data.patient.id ? { ...p, ...data.patient } : p
                ));
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error saving patient:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return <div className="patients-loading">Cargando pacientes...</div>;
    }

    return (
        <div className="patients-container">
            <div className="patients-header">
                <h2>👥 Gestión de Pacientes</h2>
                <span className="patient-count">{patients.length} pacientes</span>
            </div>

            <form className="patient-search-form" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit">🔍 Buscar</button>
                {search && (
                    <button type="button" className="clear-btn" onClick={() => { setSearch(''); fetchPatients(); }}>
                        ✕
                    </button>
                )}
            </form>

            <div className="patients-layout">
                {/* Patient List */}
                <div className="patients-list">
                    {patients.map(patient => (
                        <div
                            key={patient.id}
                            className={`patient-row ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                            onClick={() => selectPatient(patient)}
                        >
                            <div className="patient-avatar">
                                {patient.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="patient-info">
                                <span className="patient-name">{patient.full_name}</span>
                                <span className="patient-meta">
                                    {patient.session_count || 0} sesiones
                                    {patient.last_session && (
                                        <> · Última: {formatDate(patient.last_session)}</>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}

                    {patients.length === 0 && (
                        <div className="no-patients">
                            No se encontraron pacientes
                        </div>
                    )}
                </div>

                {/* Patient Detail */}
                <div className="patient-detail">
                    {selectedPatient ? (
                        <>
                            <div className="detail-header">
                                <div className="detail-avatar">
                                    {selectedPatient.full_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="detail-info">
                                    <h3>{selectedPatient.full_name}</h3>
                                    {!isEditing ? (
                                        <>
                                            <p>📧 {selectedPatient.email || 'Sin email'}</p>
                                            <p>📱 {selectedPatient.phone || 'Sin teléfono'}</p>
                                            <p>💳 {selectedPatient.preferred_payment_method || 'Sin preferencia'}</p>
                                        </>
                                    ) : null}
                                </div>
                                <button
                                    className={`edit-btn ${isEditing ? 'cancel' : ''}`}
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? '✕ Cancelar' : '✏️ Editar'}
                                </button>
                            </div>

                            {isEditing && (
                                <div className="edit-form">
                                    <div className="form-row">
                                        <label>📧 Email</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => handleEditChange('email', e.target.value)}
                                            placeholder="email@ejemplo.com"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label>📱 Teléfono</label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => handleEditChange('phone', e.target.value)}
                                            placeholder="600 000 000"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label>💳 Método de pago preferido</label>
                                        <select
                                            value={editForm.preferred_payment_method}
                                            onChange={(e) => handleEditChange('preferred_payment_method', e.target.value)}
                                        >
                                            <option value="">Sin preferencia</option>
                                            <option value="cash">Efectivo</option>
                                            <option value="transfer">Transferencia</option>
                                            <option value="bizum">Bizum</option>
                                            <option value="card">Tarjeta</option>
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <label>📝 Notas</label>
                                        <textarea
                                            value={editForm.notes}
                                            onChange={(e) => handleEditChange('notes', e.target.value)}
                                            placeholder="Notas sobre el paciente..."
                                            rows={3}
                                        />
                                    </div>
                                    <button
                                        className="save-btn"
                                        onClick={savePatient}
                                        disabled={saving}
                                    >
                                        {saving ? 'Guardando...' : '💾 Guardar cambios'}
                                    </button>
                                </div>
                            )}

                            {!isEditing && (
                                <>
                                    <div className="detail-stats">
                                        <div className="stat-box">
                                            <span className="stat-number">{selectedPatient.session_count || 0}</span>
                                            <span className="stat-label">Sesiones</span>
                                        </div>
                                        <div className="stat-box">
                                            <span className="stat-number">{formatDate(selectedPatient.first_session)}</span>
                                            <span className="stat-label">Primera cita</span>
                                        </div>
                                        <div className="stat-box">
                                            <span className="stat-number">{formatDate(selectedPatient.last_session)}</span>
                                            <span className="stat-label">Última cita</span>
                                        </div>
                                    </div>

                                    {selectedPatient.notes && (
                                        <div className="detail-notes">
                                            <h4>📝 Notas</h4>
                                            <p>{selectedPatient.notes}</p>
                                        </div>
                                    )}

                                    <div className="detail-sessions">
                                        <h4>📅 Historial de Sesiones</h4>
                                        {loadingSessions ? (
                                            <p>Cargando sesiones...</p>
                                        ) : patientSessions.length > 0 ? (
                                            <div className="sessions-list">
                                                {patientSessions.slice(0, 10).map(session => (
                                                    <div key={session.id} className={`session-row ${session.status}`}>
                                                        <span className="session-date">{formatDate(session.session_date)}</span>
                                                        <span className="session-time">{session.start_time?.slice(0, 5)}</span>
                                                        <span className="session-therapist">{session.therapist_name || '-'}</span>
                                                        <span className={`session-status ${session.payment_status || 'pending'}`}>
                                                            {session.payment_status === 'transfer' && '✅'}
                                                            {session.payment_status === 'cash' && '✅'}
                                                            {session.payment_status === 'bizum' && '✅'}
                                                            {(!session.payment_status || session.payment_status === 'pending') && '⏳'}
                                                        </span>
                                                    </div>
                                                ))}
                                                {patientSessions.length > 10 && (
                                                    <p className="more-sessions">... y {patientSessions.length - 10} más</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="no-sessions">No hay sesiones registradas</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="no-selection">
                            <span className="icon">👈</span>
                            <p>Selecciona un paciente para ver su ficha</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientsTab;
