import React, { useState, useEffect } from 'react';
import { API_ROOT } from '../services/api';
import './RemindersTab.css';

const RemindersTab = () => {
    const [reminders, setReminders] = useState([]);
    const [stats, setStats] = useState({ pending: 0, sent: 0, failed: 0 });
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [emailPreview, setEmailPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        fetchReminders();
        fetchStats();
    }, [filter]);

    const fetchReminders = async () => {
        setLoading(true);
        try {
            const statusParam = filter === 'all' ? '' : `?status=${filter}`;
            const response = await fetch(`${API_ROOT}/api/admin/reminders${statusParam}`);
            if (response.ok) {
                const data = await response.json();
                setReminders(data);
            }
        } catch (error) {
            console.error('Error fetching reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_ROOT}/api/admin/reminders/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchEmailPreview = async (reminder) => {
        if (reminder.status !== 'sent') return;

        setSelectedReminder(reminder);
        setLoadingPreview(true);
        setEmailPreview(null);

        try {
            const response = await fetch(`${API_ROOT}/api/admin/reminders/${reminder.id}/email`);
            if (response.ok) {
                const data = await response.json();
                setEmailPreview(data);
            }
        } catch (error) {
            console.error('Error fetching email preview:', error);
        } finally {
            setLoadingPreview(false);
        }
    };

    const closeModal = () => {
        setSelectedReminder(null);
        setEmailPreview(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { className: 'badge-warning', label: '⏳ Pendiente' },
            sent: { className: 'badge-success', label: '✅ Enviado' },
            failed: { className: 'badge-danger', label: '❌ Fallido' }
        };
        const badge = badges[status] || { className: 'badge-secondary', label: status };
        return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
    };

    const refresh = () => {
        fetchReminders();
        fetchStats();
    };

    return (
        <div className="reminders-tab">
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className={`stat-card pending ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
                    <div className="stat-number">{stats.pending}</div>
                    <div className="stat-label">⏳ Pendientes</div>
                </div>
                <div className={`stat-card sent ${filter === 'sent' ? 'active' : ''}`} onClick={() => setFilter('sent')}>
                    <div className="stat-number">{stats.sent}</div>
                    <div className="stat-label">✅ Enviados</div>
                </div>
                <div className={`stat-card failed ${filter === 'failed' ? 'active' : ''}`} onClick={() => setFilter('failed')}>
                    <div className="stat-number">{stats.failed}</div>
                    <div className="stat-label">❌ Fallidos</div>
                </div>
                <div className={`stat-card all ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                    <div className="stat-number">{stats.pending + stats.sent + stats.failed}</div>
                    <div className="stat-label">📊 Total</div>
                </div>
            </div>

            {/* Actions */}
            <div className="actions-bar">
                <div className="filter-pills">
                    {['all', 'pending', 'sent', 'failed'].map(f => (
                        <button
                            key={f}
                            className={`pill ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'sent' ? 'Enviados' : 'Fallidos'}
                        </button>
                    ))}
                </div>
                <button className="btn-refresh" onClick={refresh}>🔄 Actualizar</button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading">Cargando recordatorios...</div>
            ) : reminders.length === 0 ? (
                <div className="empty">No hay recordatorios {filter !== 'all' ? `con estado "${filter}"` : ''}</div>
            ) : (
                <div className="table-container">
                    <table className="reminders-table">
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Email Paciente</th>
                                <th>Terapeuta</th>
                                <th>Sesión</th>
                                <th>Programado</th>
                                <th>Enviado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reminders.map(r => (
                                <tr
                                    key={r.id}
                                    className={`row-${r.status} ${r.status === 'sent' ? 'clickable' : ''}`}
                                    onClick={() => fetchEmailPreview(r)}
                                    title={r.status === 'sent' ? 'Click para ver el email enviado' : ''}
                                >
                                    <td>{getStatusBadge(r.status)}</td>
                                    <td className="email-cell">{r.patient_email}</td>
                                    <td>{r.therapist_name || '-'}</td>
                                    <td>
                                        <strong>{formatDate(r.session_datetime)}</strong><br />
                                        <small>{formatTime(r.session_datetime)}</small>
                                    </td>
                                    <td>
                                        {formatDate(r.scheduled_send_at)}<br />
                                        <small>{formatTime(r.scheduled_send_at)}</small>
                                    </td>
                                    <td>{r.sent_at ? `${formatDate(r.sent_at)} ${formatTime(r.sent_at)}` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Email Preview Modal */}
            {selectedReminder && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content email-preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📧 Email enviado a: {selectedReminder.patient_email}</h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            {loadingPreview ? (
                                <div className="loading">Cargando email...</div>
                            ) : emailPreview ? (
                                <>
                                    <iframe
                                        srcDoc={emailPreview.html}
                                        title="Email Preview"
                                        className="email-iframe"
                                        sandbox="allow-same-origin allow-scripts"
                                    />
                                </>
                            ) : (
                                <div className="error">Error al cargar el email</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemindersTab;

