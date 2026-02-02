import React, { useState, useEffect } from 'react';
import { API_ROOT } from '../services/api';
import './BillingDashboard.css';

const API_URL = `${API_ROOT}/api`;

const BillingDashboard = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [view, setView] = useState('summary'); // 'summary' | 'invoices'
    const [invoices, setInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);

    useEffect(() => {
        if (view === 'summary') {
            fetchAllData();
        } else if (view === 'invoices') {
            fetchInvoices();
        }
    }, [selectedYear, view]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const [statsRes, billingRes] = await Promise.all([
                fetch(`${API_URL}/admin/sync/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/admin/sync/monthly-billing?year=${selectedYear}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const statsData = await statsRes.json();
            const billingData = await billingRes.json();

            setStats(statsData);
            setMonthlyData(billingData.data || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            setInvoicesLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/invoice-submissions?year=${selectedYear}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInvoices(data.submissions);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setInvoicesLoading(false);
        }
    };

    const executeSync = async () => {
        try {
            setSyncing(true);
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/admin/sync/year`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchAllData();
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    };

    const getMonthName = (month) => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return months[parseInt(month) - 1] || '';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Aggregate monthly data
    const monthlyTotals = {};
    monthlyData.forEach(row => {
        const month = parseInt(row.month);
        if (!monthlyTotals[month]) {
            monthlyTotals[month] = { sessions: 0, revenue: 0, paid: 0 };
        }
        monthlyTotals[month].sessions += parseInt(row.billable_sessions) || 0;
        monthlyTotals[month].revenue += parseFloat(row.total_revenue) || 0;
        monthlyTotals[month].paid += parseFloat(row.paid_amount) || 0;
    });

    // Therapist totals
    const therapistTotals = {};
    monthlyData.forEach(row => {
        if (!therapistTotals[row.therapist_name]) {
            therapistTotals[row.therapist_name] = { sessions: 0, revenue: 0 };
        }
        therapistTotals[row.therapist_name].sessions += parseInt(row.billable_sessions) || 0;
        therapistTotals[row.therapist_name].revenue += parseFloat(row.total_revenue) || 0;
    });

    const totalSessions = Object.values(monthlyTotals).reduce((s, m) => s + m.sessions, 0);
    const totalRevenue = Object.values(monthlyTotals).reduce((s, m) => s + m.revenue, 0);
    const totalPaid = Object.values(monthlyTotals).reduce((s, m) => s + m.paid, 0);

    if (loading) {
        return <div className="bd-loading">Cargando dashboard...</div>;
    }

    return (
        <div className="bd-container">
            {/* Header */}
            <div className="bd-header">
                <div className="bd-title">
                    <h2>📊 Dashboard de Facturación</h2>
                </div>

                {/* View Tabs */}
                <div className="bd-tabs">
                    <button
                        className={`bd-tab ${view === 'summary' ? 'active' : ''}`}
                        onClick={() => setView('summary')}
                    >
                        Resumen
                    </button>
                    <button
                        className={`bd-tab ${view === 'invoices' ? 'active' : ''}`}
                        onClick={() => setView('invoices')}
                    >
                        Facturas Presentadas
                    </button>
                </div>

                <div className="bd-actions">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bd-select"
                    >
                        {[2023, 2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    {view === 'summary' && (
                        <button
                            className="bd-sync-btn"
                            onClick={executeSync}
                            disabled={syncing}
                        >
                            {syncing ? '⏳' : '🔄'} Sincronizar
                        </button>
                    )}
                </div>
            </div>

            {view === 'invoices' ? (
                <div className="bd-panel full-width">
                    <h3>📄 Historial de Facturas ({selectedYear})</h3>
                    {invoicesLoading ? (
                        <div className="bd-loading-section">Cargando facturas...</div>
                    ) : invoices.length === 0 ? (
                        <div className="bd-empty-state">No hay facturas presentadas para este año.</div>
                    ) : (
                        <table className="bd-table invoices-table">
                            <thead>
                                <tr>
                                    <th>Fecha Presentación</th>
                                    <th>Mes Facturado</th>
                                    <th>Terapeuta</th>
                                    <th>Nº Factura</th>
                                    <th>Importe Total</th>
                                    <th>Info</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => {
                                    const exclusions = inv.excluded_session_ids ? (typeof inv.excluded_session_ids === 'string' ? JSON.parse(inv.excluded_session_ids) : inv.excluded_session_ids) : [];
                                    const excludedCount = exclusions.length;

                                    return (
                                        <tr key={inv.id}>
                                            <td>{formatDate(inv.created_at)}</td>
                                            <td>{getMonthName(inv.month)} {inv.year}</td>
                                            <td>
                                                <span
                                                    className="therapist-badge"
                                                    style={{ borderLeft: `4px solid ${inv.therapist_color || '#ccc'}`, paddingLeft: '8px' }}
                                                >
                                                    {inv.therapist_name}
                                                </span>
                                            </td>
                                            <td>{inv.invoice_number || '-'}</td>
                                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(inv.total_amount)}</td>
                                            <td>
                                                {excludedCount > 0 && (
                                                    <span className="exclusion-tag" title={`${excludedCount} sesiones excluidas`}>
                                                        ⚠️ {excludedCount} Excl.
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="status-badge success">Presentada</span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <>
                    {/* Quick Stats Row */}
                    <div className="bd-quick-stats">
                        <div className="bd-stat">
                            <span className="bd-stat-value">{stats?.sessions?.total_sessions || 0}</span>
                            <span className="bd-stat-name">Sesiones</span>
                        </div>
                        <div className="bd-stat">
                            <span className="bd-stat-value">{stats?.sessions?.billable_sessions || 0}</span>
                            <span className="bd-stat-name">Facturables</span>
                        </div>
                        <div className="bd-stat">
                            <span className="bd-stat-value">{stats?.patients?.total || 0}</span>
                            <span className="bd-stat-name">Pacientes</span>
                        </div>
                        <div className="bd-stat">
                            <span className="bd-stat-value">{stats?.sessions?.therapists_with_sessions || 0}</span>
                            <span className="bd-stat-name">Terapeutas</span>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="bd-grid">
                        {/* Left: Monthly Table */}
                        <div className="bd-panel">
                            <h3>📅 Resumen Mensual {selectedYear}</h3>
                            <table className="bd-table">
                                <thead>
                                    <tr>
                                        <th>Mes</th>
                                        <th>Sesiones</th>
                                        <th>Facturado</th>
                                        <th>Cobrado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                        const data = monthlyTotals[month] || { sessions: 0, revenue: 0, paid: 0 };
                                        if (data.sessions === 0) return null;
                                        return (
                                            <tr key={month}>
                                                <td><strong>{getMonthName(month)}</strong></td>
                                                <td>{data.sessions}</td>
                                                <td>{formatCurrency(data.revenue)}</td>
                                                <td className="green">{formatCurrency(data.paid)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td><strong>TOTAL</strong></td>
                                        <td><strong>{totalSessions}</strong></td>
                                        <td><strong>{formatCurrency(totalRevenue)}</strong></td>
                                        <td className="green"><strong>{formatCurrency(totalPaid)}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Right: Therapists */}
                        <div className="bd-panel">
                            <h3>👨‍⚕️ Por Terapeuta</h3>
                            <div className="bd-therapist-list">
                                {Object.entries(therapistTotals)
                                    .sort((a, b) => b[1].revenue - a[1].revenue)
                                    .map(([name, data]) => (
                                        <div key={name} className="bd-therapist-row">
                                            <span className="bd-t-name">{name}</span>
                                            <span className="bd-t-sessions">{data.sessions} ses.</span>
                                            <span className="bd-t-revenue">{formatCurrency(data.revenue)}</span>
                                        </div>
                                    ))
                                }
                                {Object.keys(therapistTotals).length === 0 && (
                                    <p className="bd-empty">Sin datos para este año</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default BillingDashboard;
