import React, { useState, useEffect } from 'react';
import { API_ROOT } from '../services/api';
import './ProfileTab.css';

const API_URL = `${API_ROOT}/api`;

const ProfileTab = ({ user, onLogout }) => {
    const [activeSection, setActiveSection] = useState('billing');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Billing data state
    const [billingData, setBillingData] = useState({
        full_name: '',
        nif: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        iban: '',
        phone: '',
        email: ''
    });

    // Center data state (admin only)
    const [centerData, setCenterData] = useState({
        name: '',
        legal_name: '',
        nif: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: ''
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchBillingData();
        if (user.role === 'admin') {
            fetchCenterData();
        }
    }, [user.role]);

    const fetchBillingData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/my-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setBillingData(data);
        } catch (error) {
            console.error('Error fetching billing data:', error);
        }
    };

    const fetchCenterData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/center-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setCenterData(data);
        } catch (error) {
            console.error('Error fetching center data:', error);
        }
    };

    const handleBillingDataChange = (field, value) => {
        setBillingData(prev => ({ ...prev, [field]: value }));
    };

    const handleCenterDataChange = (field, value) => {
        setCenterData(prev => ({ ...prev, [field]: value }));
    };

    const saveBillingData = async () => {
        try {
            setLoading(true);
            setMessage('');
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/my-data`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(billingData)
            });
            const data = await res.json();
            setMessage('✅ Datos guardados correctamente');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('❌ Error al guardar datos');
        } finally {
            setLoading(false);
        }
    };

    const saveCenterData = async () => {
        try {
            setLoading(true);
            setMessage('');
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/center-data`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(centerData)
            });
            const data = await res.json();
            setMessage('✅ Datos del centro guardados correctamente');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('❌ Error al guardar datos del centro');
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage('❌ Las contraseñas no coinciden');
            return;
        }

        try {
            setLoading(true);
            setMessage('');
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (res.ok) {
                setMessage('✅ Contraseña cambiada correctamente');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setMessage(''), 3000);
            } else {
                const data = await res.json();
                setMessage(`❌ ${data.message || 'Error al cambiar contraseña'}`);
            }
        } catch (error) {
            setMessage('❌ Error al cambiar contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>👤 Mi Cuenta</h1>
            </div>

            {/* Navigation Tabs */}
            <div className="profile-nav">
                <button
                    className={`profile-nav-btn ${activeSection === 'billing' ? 'active' : ''}`}
                    onClick={() => setActiveSection('billing')}
                >
                    📋 Mis Datos
                </button>
                <button
                    className={`profile-nav-btn ${activeSection === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveSection('security')}
                >
                    🔒 Seguridad
                </button>
                {user.role === 'admin' && (
                    <button
                        className={`profile-nav-btn ${activeSection === 'center' ? 'active' : ''}`}
                        onClick={() => setActiveSection('center')}
                    >
                        🏢 Datos del Centro
                    </button>
                )}
            </div>

            {/* Message - Fixed position */}
            {message && (
                <div className={`profile-message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {/* Billing Data Section */}
            {activeSection === 'billing' && (
                <div className="profile-section">
                    <h2>Mis Datos de Facturación</h2>
                    <p className="section-description">
                        Estos datos aparecerán en tus facturas generadas
                    </p>

                    <div className="profile-form">
                        <div className="form-group">
                            <label>Nombre Completo</label>
                            <input
                                type="text"
                                value={billingData.full_name}
                                onChange={(e) => handleBillingDataChange('full_name', e.target.value)}
                                placeholder="Ej: Anna Becerra Fernandez"
                            />
                        </div>

                        <div className="form-group">
                            <label>NIF/CIF</label>
                            <input
                                type="text"
                                value={billingData.nif}
                                onChange={(e) => handleBillingDataChange('nif', e.target.value)}
                                placeholder="Ej: 12345678Y"
                            />
                        </div>

                        <div className="form-group">
                            <label>Dirección (Línea 1)</label>
                            <input
                                type="text"
                                value={billingData.address_line1}
                                onChange={(e) => handleBillingDataChange('address_line1', e.target.value)}
                                placeholder="Ej: Cancasimir II, 1, 1"
                            />
                        </div>

                        <div className="form-group">
                            <label>Dirección (Línea 2) - Opcional</label>
                            <input
                                type="text"
                                value={billingData.address_line2}
                                onChange={(e) => handleBillingDataChange('address_line2', e.target.value)}
                                placeholder="Escalera, piso, puerta..."
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Ciudad</label>
                                <input
                                    type="text"
                                    value={billingData.city}
                                    onChange={(e) => handleBillingDataChange('city', e.target.value)}
                                    placeholder="Ej: Cerdanyola del Vallès"
                                />
                            </div>

                            <div className="form-group">
                                <label>Código Postal</label>
                                <input
                                    type="text"
                                    value={billingData.postal_code}
                                    onChange={(e) => handleBillingDataChange('postal_code', e.target.value)}
                                    placeholder="Ej: 08290"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>IBAN</label>
                            <input
                                type="text"
                                value={billingData.iban}
                                onChange={(e) => handleBillingDataChange('iban', e.target.value)}
                                placeholder="Ej: ES12 4242 4242 3417 5596 2246"
                            />
                        </div>

                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                value={billingData.phone}
                                onChange={(e) => handleBillingDataChange('phone', e.target.value)}
                                placeholder="Ej: 612 345 678"
                            />
                        </div>

                        <div className="form-group">
                            <label>Correo Personal</label>
                            <input
                                type="email"
                                value={billingData.email}
                                onChange={(e) => handleBillingDataChange('email', e.target.value)}
                                placeholder="Ej: tu@email.com"
                            />
                        </div>

                        <button
                            className="btn-save"
                            onClick={saveBillingData}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                        </button>
                    </div>
                </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
                <div className="profile-section">
                    <h2>Seguridad</h2>

                    <div className="profile-form">
                        <h3>Cambiar Contraseña</h3>

                        <div className="form-group">
                            <label>Contraseña Actual</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label>Nueva Contraseña</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmar Nueva Contraseña</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            />
                        </div>

                        <button
                            className="btn-save"
                            onClick={changePassword}
                            disabled={loading}
                        >
                            {loading ? 'Cambiando...' : '🔑 Cambiar Contraseña'}
                        </button>

                        <div className="logout-section">
                            <h3>Cerrar Sesión</h3>
                            <p>Si deseas salir de tu cuenta, haz clic en el siguiente botón:</p>
                            <button className="btn-logout" onClick={onLogout}>
                                🚪 Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Center Data Section (Admin Only) */}
            {activeSection === 'center' && user.role === 'admin' && (
                <div className="profile-section">
                    <h2>Datos del Centro</h2>
                    <p className="section-description">
                        Estos datos aparecen como "Facturar a" en todas las facturas
                    </p>

                    <div className="profile-form">
                        <div className="form-group">
                            <label>Nombre del Centro</label>
                            <input
                                type="text"
                                value={centerData.name}
                                onChange={(e) => handleCenterDataChange('name', e.target.value)}
                                placeholder="Ej: Esencialmente Psicología"
                            />
                        </div>

                        <div className="form-group">
                            <label>Nombre Legal / Responsable</label>
                            <input
                                type="text"
                                value={centerData.legal_name}
                                onChange={(e) => handleCenterDataChange('legal_name', e.target.value)}
                                placeholder="Ej: Anna Becerra"
                            />
                        </div>

                        <div className="form-group">
                            <label>NIF/CIF</label>
                            <input
                                type="text"
                                value={centerData.nif}
                                onChange={(e) => handleCenterDataChange('nif', e.target.value)}
                                placeholder="Ej: 47235789E"
                            />
                        </div>

                        <div className="form-group">
                            <label>Dirección (Línea 1)</label>
                            <input
                                type="text"
                                value={centerData.address_line1}
                                onChange={(e) => handleCenterDataChange('address_line1', e.target.value)}
                                placeholder="Ej: C/ del Pintor Togores, 1"
                            />
                        </div>

                        <div className="form-group">
                            <label>Dirección (Línea 2) - Opcional</label>
                            <input
                                type="text"
                                value={centerData.address_line2}
                                onChange={(e) => handleCenterDataChange('address_line2', e.target.value)}
                                placeholder="Escalera, piso, puerta..."
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Ciudad</label>
                                <input
                                    type="text"
                                    value={centerData.city}
                                    onChange={(e) => handleCenterDataChange('city', e.target.value)}
                                    placeholder="Ej: Cerdanyola del Vallès"
                                />
                            </div>

                            <div className="form-group">
                                <label>Código Postal</label>
                                <input
                                    type="text"
                                    value={centerData.postal_code}
                                    onChange={(e) => handleCenterDataChange('postal_code', e.target.value)}
                                    placeholder="Ej: 08290"
                                />
                            </div>
                        </div>

                        <button
                            className="btn-save"
                            onClick={saveCenterData}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : '💾 Guardar Datos del Centro'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileTab;
