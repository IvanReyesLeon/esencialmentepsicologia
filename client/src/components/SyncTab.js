import React, { useState, useEffect } from 'react';
import { API_ROOT } from '../services/api';
import './SyncTab.css';

const API_URL = `${API_ROOT}/api`;

const SyncTab = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSyncResult, setLastSyncResult] = useState(null);
    const [patients, setPatients] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/sync/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const executeSync = async (type) => {
        try {
            setSyncing(true);
            setLastSyncResult(null);
            const token = localStorage.getItem('token');

            const res = await fetch(`${API_URL}/admin/sync/${type}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();
            setLastSyncResult(data);

            // Refresh stats after sync
            await fetchStats();
        } catch (error) {
            console.error('Sync error:', error);
            setLastSyncResult({ success: false, message: error.message });
        } finally {
            setSyncing(false);
        }
    };

    const searchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/sync/patients?search=${encodeURIComponent(patientSearch)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPatients(data.patients || []);
        } catch (error) {
            console.error('Error searching patients:', error);
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

    if (loading && !stats) {
        return <div className="sync-loading">Cargando estadísticas...</div>;
    }

    return (
        <div className="sync-container">
            <h2>🔄 Sincronización de Sesiones</h2>
            <p className="sync-description">
                Sincroniza los eventos de Google Calendar con la base de datos local para generar reportes y estadísticas.
            </p>

            {/* Stats Cards */}
            {stats && (
                <div className="sync-stats-grid">
                    <div className="sync-stat-card">
                        <span className="stat-value">{stats.sessions?.total_sessions || 0}</span>
                        <span className="stat-label">Sesiones Totales</span>
                    </div>
                    <div className="sync-stat-card">
                        <span className="stat-value">{stats.sessions?.billable_sessions || 0}</span>
                        <span className="stat-label">Facturables</span>
                    </div>
                    <div className="sync-stat-card">
                        <span className="stat-value">{stats.sessions?.cancelled_sessions || 0}</span>
                        <span className="stat-label">Canceladas</span>
                    </div>
                    <div className="sync-stat-card">
                        <span className="stat-value">{stats.patients?.total || 0}</span>
                        <span className="stat-label">Pacientes</span>
                    </div>
                    <div className="sync-stat-card">
                        <span className="stat-value">{stats.sessions?.therapists_with_sessions || 0}</span>
                        <span className="stat-label">Terapeutas</span>
                    </div>
                    <div className="sync-stat-card full-width">
                        <span className="stat-label">Última sincronización</span>
                        <span className="stat-value small">{formatDate(stats.sessions?.last_sync)}</span>
                    </div>
                </div>
            )}

            {/* Sync Actions */}
            <div className="sync-actions">
                <h3>Ejecutar Sincronización</h3>
                <div className="sync-buttons">
                    <button
                        className="sync-btn recent"
                        onClick={() => executeSync('recent?days=30')}
                        disabled={syncing}
                    >
                        📅 Últimos 30 días
                    </button>
                    <button
                        className="sync-btn month"
                        onClick={() => executeSync('month')}
                        disabled={syncing}
                    >
                        📆 Mes actual
                    </button>
                    <button
                        className="sync-btn year"
                        onClick={() => executeSync('year')}
                        disabled={syncing}
                    >
                        📊 Año completo
                    </button>
                </div>

                {syncing && (
                    <div className="sync-progress">
                        <span className="spinner"></span>
                        Sincronizando...
                    </div>
                )}

                {lastSyncResult && (
                    <div className={`sync-result ${lastSyncResult.success ? 'success' : 'error'}`}>
                        <strong>{lastSyncResult.success ? '✅' : '❌'} {lastSyncResult.message}</strong>
                        {lastSyncResult.stats && (
                            <div className="sync-stats-summary">
                                <span>Procesados: {lastSyncResult.stats.processed}</span>
                                <span>Creados: {lastSyncResult.stats.created}</span>
                                <span>Actualizados: {lastSyncResult.stats.updated}</span>
                                {lastSyncResult.stats.errors > 0 && (
                                    <span className="errors">Errores: {lastSyncResult.stats.errors}</span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Patients Search */}
            <div className="patients-section">
                <h3>👥 Buscar Pacientes</h3>
                <div className="patient-search-bar">
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                    />
                    <button onClick={searchPatients}>Buscar</button>
                </div>

                {patients.length > 0 && (
                    <div className="patients-list">
                        {patients.map(patient => (
                            <div key={patient.id} className="patient-card">
                                <div className="patient-name">{patient.full_name}</div>
                                <div className="patient-stats">
                                    <span>{patient.session_count || 0} sesiones</span>
                                    {patient.last_session && (
                                        <span>Última: {formatDate(patient.last_session)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SyncTab;
