import React, { useState, useEffect } from 'react';
import { API_ROOT } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './BillingDashboard.css';

const API_URL = `${API_ROOT}/api`;

const BillingDashboard = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState('all'); // New state for month filter
    const [view, setView] = useState('summary'); // 'summary' | 'invoices'
    const [invoices, setInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);

    useEffect(() => {
        if (view === 'summary') {
            fetchAllData();
        } else if (view === 'invoices') {
            fetchInvoices();
        }
    }, [selectedYear, selectedMonth, view]); // Added selectedMonth dependency

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
            let url = `${API_URL}/admin/billing/invoice-submissions?year=${selectedYear}`;
            if (selectedMonth !== 'all') {
                url += `&month=${selectedMonth}`;
            }

            const res = await fetch(url, {
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
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        // Backend stores months as 0-11 (JS Date format)
        return months[parseInt(month)] || '';
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

    const handleDownloadPDF = async (invoice) => {
        try {
            const token = localStorage.getItem('token');
            const { year, month, therapist_id } = invoice;

            // Fetch Centre Data and Invoice Details (Therapist Data + Sessions)
            // We need a new endpoint to get full details for admin reconstruction
            const [centerRes, detailsRes] = await Promise.all([
                fetch(`${API_URL}/admin/billing/center-data`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/admin/billing/invoice-details?year=${year}&month=${month}&therapistId=${therapist_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const centerData = await centerRes.json();
            const details = await detailsRes.json();
            const therapistData = details.therapistData || {};
            const sessions = details.sessions || [];

            // Filter excluded sessions (using the stored excluded_session_ids from the invoice record)
            // The details endpoint might return all sessions, so we filter again to be safe
            // or rely on what matches the totals. 
            // Better: Filter by the IDs in invoice.excluded_session_ids
            let exclusions = [];
            if (invoice.excluded_session_ids) {
                exclusions = typeof invoice.excluded_session_ids === 'string'
                    ? JSON.parse(invoice.excluded_session_ids)
                    : invoice.excluded_session_ids;
            }
            const excludedSet = new Set(exclusions);

            const activeSessions = sessions.filter(s => !excludedSet.has(s.id));

            // Determine if we use stored totals or recalculated ones
            // Using stored totals is safer for the summary, but table needs session breakdown.

            const doc = new jsPDF();

            // Header with orange background
            doc.setFillColor(255, 140, 66);
            doc.rect(0, 0, 210, 40, 'F');

            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('FACTURA', 105, 15, { align: 'center' });

            if (invoice.invoice_number) {
                doc.setFontSize(14);
                doc.text(`Nº ${invoice.invoice_number}`, 105, 24, { align: 'center' });
            }

            // Date info
            const monthName = getMonthName(invoice.month);
            // Format submission date
            const submissionDate = invoice.submitted_at
                ? new Date(invoice.submitted_at).toLocaleDateString('es-ES')
                : new Date().toLocaleDateString('es-ES'); // Fallback to now if missing

            doc.setFontSize(11);
            doc.text(`Mes Facturado: ${monthName} ${invoice.year}`, 105, invoice.invoice_number ? 32 : 28, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Fecha de Emisión: ${submissionDate}`, 105, invoice.invoice_number ? 37 : 33, { align: 'center' });

            // Reset text color
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);

            // Left column - "FACTURAR A" (Center Data)
            doc.setFont(undefined, 'bold');
            doc.text('FACTURAR A:', 14, 50);
            doc.setFont(undefined, 'normal');

            let yPos = 56;
            if (centerData.name) { doc.text(centerData.name, 14, yPos); yPos += 5; }
            if (centerData.legal_name) { doc.text(`(${centerData.legal_name})`, 14, yPos); yPos += 5; }
            if (centerData.nif) { doc.text(centerData.nif, 14, yPos); yPos += 5; }
            if (centerData.address_line1) { doc.text(centerData.address_line1, 14, yPos); yPos += 5; }
            if (centerData.address_line2) { doc.text(centerData.address_line2, 14, yPos); yPos += 5; }
            const cityPostal = [centerData.postal_code, centerData.city].filter(Boolean).join(' ');
            if (cityPostal) { doc.text(cityPostal, 14, yPos); }

            // Right column - "DE" (Therapist Data)
            doc.setFont(undefined, 'bold');
            doc.text('DE:', 120, 50);
            doc.setFont(undefined, 'normal');

            yPos = 56;
            if (therapistData.full_name) { doc.text(therapistData.full_name, 120, yPos); yPos += 5; }
            if (therapistData.nif) { doc.text(therapistData.nif, 120, yPos); yPos += 5; }
            if (therapistData.address_line1) { doc.text(therapistData.address_line1, 120, yPos); yPos += 5; }
            const tCityPostal = [therapistData.postal_code, therapistData.city].filter(Boolean).join(' ');
            if (tCityPostal) { doc.text(tCityPostal, 120, yPos); yPos += 5; }
            if (therapistData.iban) { doc.text(therapistData.iban, 120, yPos); }

            // Group sessions by price
            const sessionsByPrice = {};
            activeSessions.forEach(session => {
                // Use modified_price if exists, else price
                const finalPrice = session.modified_price || session.price || 0;
                // Group key: exact price value
                if (!sessionsByPrice[finalPrice]) {
                    sessionsByPrice[finalPrice] = { count: 0, price: finalPrice };
                }
                sessionsByPrice[finalPrice].count++;
            });

            // Create table data
            const tableData = Object.values(sessionsByPrice).map(group => [
                `${group.count} ${group.count === 1 ? 'sesión' : 'sesiones'}`,
                formatCurrency(group.price),
                `${group.count} x ${formatCurrency(group.price)}`,
                formatCurrency(group.count * group.price)
            ]);

            autoTable(doc, {
                startY: 90,
                head: [['Descripción', 'Precio/Unidad', 'Cantidad', 'Total']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [255, 140, 66], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10 }
            });

            // Summary section using STORED TOTALS from invoice record to ensure consistency
            let finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');

            const labelX = 110;
            const valueX = 195;

            doc.text('SUBTOTAL:', labelX, finalY);
            doc.text(formatCurrency(invoice.subtotal), valueX, finalY, { align: 'right' });
            finalY += 7;

            doc.text(`RETENCIÓN CENTRO (${invoice.center_percentage}%):`, labelX, finalY);
            doc.text(formatCurrency(invoice.center_amount), valueX, finalY, { align: 'right' });
            finalY += 7;

            doc.text(`BASE DISPONIBLE:`, labelX, finalY);
            // Calculate base available if not explicit in invoice record (usually subtotal - center_amount)
            // Or use stored totals if available. Invoice record has: subtotal, center_amount, irpf_amount, total_amount
            // Base = Subtotal - CenterAmount
            const baseDisponible = parseFloat(invoice.subtotal) - parseFloat(invoice.center_amount);
            doc.text(formatCurrency(baseDisponible), valueX, finalY, { align: 'right' });
            finalY += 7;

            doc.text(`- ${invoice.irpf_percentage}% IRPF:`, labelX, finalY);
            doc.text(formatCurrency(invoice.irpf_amount), valueX, finalY, { align: 'right' });
            finalY += 10;

            doc.setFontSize(14);
            doc.setTextColor(255, 140, 66);
            doc.text('TOTAL FACTURA:', labelX, finalY);
            doc.text(formatCurrency(invoice.total_amount), valueX, finalY, { align: 'right' });

            doc.save(`Factura_${invoice.year}_${getMonthName(invoice.month)}_${invoice.therapist_name.replace(/\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Inténtelo de nuevo.');
        }
    };

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
                    {view === 'invoices' && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bd-select"
                            style={{ marginRight: '10px' }}
                        >
                            <option value="all">Todo el año</option>
                            {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                    )}
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
                        <div className="bd-table-responsive">
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
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => {
                                        const exclusions = inv.excluded_session_ids ? (typeof inv.excluded_session_ids === 'string' ? JSON.parse(inv.excluded_session_ids) : inv.excluded_session_ids) : [];
                                        const excludedCount = exclusions.length;

                                        return (
                                            <tr key={inv.id}>
                                                <td>{formatDate(inv.submitted_at)}</td>
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
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => handleDownloadPDF(inv)}
                                                            title="Descargar PDF"
                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}
                                                        >
                                                            📥
                                                        </button>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={async () => {
                                                                if (window.confirm(`¿Estás seguro de que quieres devolver esta factura de ${inv.therapist_name}? Esto permitirá al terapeuta volver a generarla.`)) {
                                                                    try {
                                                                        const token = localStorage.getItem('token');
                                                                        const res = await fetch(`${API_URL}/admin/billing/revoke-invoice`, {
                                                                            method: 'POST',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                                Authorization: `Bearer ${token}`
                                                                            },
                                                                            body: JSON.stringify({ id: inv.id })
                                                                        });
                                                                        const data = await res.json();
                                                                        if (data.success) {
                                                                            alert('Factura devuelta correctamente');
                                                                            fetchInvoices(); // Refresh list
                                                                        } else {
                                                                            alert('Error al devolver factura: ' + data.message);
                                                                        }
                                                                    } catch (error) {
                                                                        console.error('Error revoking invoice:', error);
                                                                        alert('Error al conectar con el servidor');
                                                                    }
                                                                }
                                                            }}
                                                            title="Devolver Factura (Permitir corrección)"
                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}
                                                        >
                                                            ↩️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
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
