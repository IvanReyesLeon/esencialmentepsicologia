import React, { useState, useEffect } from 'react';
import './BillingTab.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

const BillingTab = ({ user }) => {
    const [view, setView] = useState('months'); // 'months' | 'weeks' | 'detail' | 'pending'
    const [billingMode, setBillingMode] = useState('calendar'); // 'calendar' | 'payments'
    const [globalSessions, setGlobalSessions] = useState([]);
    const [globalStartDate, setGlobalStartDate] = useState(`${new Date().getFullYear()}-01-01`);
    const [globalEndDate, setGlobalEndDate] = useState(`${new Date().getFullYear()}-12-31`);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [weeks, setWeeks] = useState([]);
    const [weekData, setWeekData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedTherapist, setExpandedTherapist] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [filterTherapist, setFilterTherapist] = useState('all'); // 'all' or therapist name
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'paid'
    const [transferDateSessionId, setTransferDateSessionId] = useState(null);
    const [transferDateValue, setTransferDateValue] = useState('');


    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const currentMonth = new Date().getMonth();

    useEffect(() => {
        if (billingMode === 'payments') {
            fetchGlobalSessions();
        }
    }, [billingMode, globalStartDate, globalEndDate, filterTherapist]);

    // Fetch weeks when month is selected
    useEffect(() => {
        if (selectedMonth !== null && billingMode === 'calendar') {
            fetchWeeks();
        }
    }, [selectedMonth, selectedYear, billingMode]);

    // Fetch week detail when week is selected
    useEffect(() => {
        if (selectedWeek !== null && billingMode === 'calendar') {
            fetchWeekDetail();
        }
    }, [selectedWeek, billingMode]);

    const fetchGlobalSessions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_URL}/admin/billing/global?startDate=${globalStartDate}&endDate=${globalEndDate}`;

            // If user is admin and filterTherapist is set (and not 'all'), pass it
            // Note: filterTherapist state stores NAME currently. 
            // We need ID for the backend query if we want efficient filtering, 
            // but for now the backend filters by generic ID/Name match or we can filter in frontend.
            // Actually, existing filter logic uses `therapist.name`.
            // Let's filter in FRONTEND for Admin Name Filter to be consistent with previous logic, 
            // OR fetch all and filter. Fetching all is safer for "global" context.
            // But if we want to filter by specific ID, we need to know the ID.
            // Let's fetch ALL and filter in frontend for now to reuse 'filterTherapist' name-based state.

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setGlobalSessions(data.sessions || []);
        } catch (error) {
            console.error('Error fetching global sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${API_URL}/admin/billing/weeks?year=${selectedYear}&month=${selectedMonth}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            setWeeks(data.weeks || []);
            setView('weeks');
        } catch (error) {
            console.error('Error fetching weeks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeekDetail = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const endpoint = user.role === 'admin'
                ? `${API_URL}/admin/billing/weekly?year=${selectedYear}&month=${selectedMonth}&week=${selectedWeek}`
                : `${API_URL}/admin/billing/my-sessions?year=${selectedYear}&month=${selectedMonth}&week=${selectedWeek}`;

            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setWeekData(data);
            setView('detail');
        } catch (error) {
            console.error('Error fetching week detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (view === 'detail') {
            setSelectedWeek(null);
            setWeekData(null);
            setView('weeks');
        } else if (view === 'weeks') {
            setSelectedMonth(null);
            setWeeks([]);
            setView('months');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const markPayment = async (eventId, paymentType, paymentDate = null) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/admin/billing/sessions/${eventId}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ paymentType, paymentDate })
            });
            // Refresh data
            if (billingMode === 'payments') {
                fetchGlobalSessions();
            } else {
                fetchWeekDetail();
            }
            setTransferDateSessionId(null);
            setTransferDateValue('');
        } catch (error) {
            console.error('Error marking payment:', error);
        }
    };

    const handleTransferClick = (sessionId) => {
        setTransferDateSessionId(sessionId);
        setTransferDateValue(new Date().toISOString().split('T')[0]); // Default to today
    };

    const handlePendingClick = () => {
        if (!weekData) return;
        const period = weekData.period || weekData.week;
        if (!period) return;

        // Convert to YYYY-MM-DD
        const s = new Date(period.start).toISOString().split('T')[0];
        const e = new Date(period.end).toISOString().split('T')[0];

        setGlobalStartDate(s);
        setGlobalEndDate(e);
        setBillingMode('payments');
        setFilterStatus('pending'); // Auto-filter to show only pending
        // filterTherapist state is preserved for Admin
    };

    const handleTherapistHistoryClick = () => {
        // Show full year history of PAID sessions
        const currentYear = new Date().getFullYear();
        setGlobalStartDate(`${currentYear}-01-01`);
        setGlobalEndDate(`${currentYear}-12-31`);
        setBillingMode('payments');
        setFilterStatus('paid'); // Auto-filter to show only paid
    };

    const handleMonthPaymentsClick = () => {
        // Set date to full month
        // selectedMonth is 0-index
        const year = selectedYear;
        const month = selectedMonth;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // Last day of month

        // Adjust for timezone/formatting
        const s = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const e = endDate.toLocaleDateString('en-CA');

        setGlobalStartDate(s);
        setGlobalEndDate(e);
        setBillingMode('payments');
        setBillingMode('payments');
    };

    // === MONTH SELECTOR VIEW ===
    const renderMonths = () => (
        <div className="billing-months">
            <div className="billing-header">
                <h2>📅 Selecciona un Mes</h2>
                <div className="year-selector">
                    <button onClick={() => setSelectedYear(y => y - 1)}>←</button>
                    <span>{selectedYear}</span>
                    <button onClick={() => setSelectedYear(y => y + 1)}>→</button>
                </div>
            </div>
            <div className="months-grid">
                {months.map((month, index) => (
                    <div
                        key={index}
                        className={`month-card ${index === currentMonth && selectedYear === new Date().getFullYear() ? 'current' : ''}`}
                        onClick={() => setSelectedMonth(index)}
                    >
                        <span className="month-name">{month}</span>
                        {index === currentMonth && selectedYear === new Date().getFullYear() && (
                            <span className="current-badge">Actual</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    // === WEEKS LIST VIEW ===
    const renderWeeks = () => (
        <div className="billing-weeks">
            <div className="billing-header">
                <button className="btn-back-billing" onClick={handleBack}>← Volver</button>
                <h2>📆 {months[selectedMonth]} {selectedYear}</h2>
                {user.role === 'admin' && (
                    <button className="btn-month-payments" onClick={handleMonthPaymentsClick}>
                        Ver Pagos del Mes
                    </button>
                )}
            </div>
            <div className="weeks-list">
                {weeks.map((week, index) => (
                    <div
                        key={index}
                        className="week-card"
                        onClick={() => setSelectedWeek(week.weekNumber)}
                    >
                        <div className="week-info">
                            <span className="week-number">Semana {week.weekNumber}</span>
                            <span className="week-dates">{week.label}</span>
                        </div>
                        <span className="week-arrow">→</span>
                    </div>
                ))}
            </div>
        </div>
    );

    // === WEEK DETAIL VIEW (ADMIN) ===
    const renderWeekDetailAdmin = () => {
        if (!weekData) return null;

        // Group ALL sessions by day (not by therapist first)
        const sessionsByDay = {};
        weekData.byTherapist?.forEach(therapist => {
            therapist.sessions?.forEach(session => {
                // Apply therapist filter
                const therapistName = session.therapistName || therapist.therapistName;
                if (filterTherapist !== 'all' && therapistName !== filterTherapist) return;

                const dayKey = session.date;
                if (!sessionsByDay[dayKey]) {
                    sessionsByDay[dayKey] = {
                        date: session.date,
                        dayOfWeek: session.dayOfWeek,
                        sessions: [],
                        totalAmount: 0
                    };
                }
                // Session already has therapistName and therapistColor from backend
                sessionsByDay[dayKey].sessions.push({
                    ...session,
                    therapistName: therapistName,
                    therapistColor: session.therapistColor || therapist.color || '#e0e0e0'
                });
                sessionsByDay[dayKey].totalAmount += session.price;
            });
        });

        // Sort days
        const sortedDays = Object.values(sessionsByDay).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        return (
            <div className="billing-detail">
                <div className="billing-header">
                    <button className="btn-back-billing" onClick={handleBack}>← Volver</button>
                    <h2>📊 Semana {weekData.week?.number} - {weekData.week?.label}</h2>
                </div>

                {/* Summary Cards */}
                <div className="billing-summary-cards">
                    <div className="summary-card total">
                        <span className="summary-value">{formatCurrency(weekData.summary?.totalAmount || 0)}</span>
                        <span className="summary-label">Total Esperado</span>
                    </div>
                    <div className="summary-card paid">
                        <span className="summary-value">{formatCurrency(weekData.summary?.paidAmount || 0)}</span>
                        <span className="summary-label">✅ Pagado</span>
                    </div>
                    <div
                        className="summary-card pending clickable"
                        onClick={handlePendingClick}
                        title="Gestionar Pagos de esta semana"
                    >
                        <span className="summary-value">{formatCurrency(weekData.summary?.pendingAmount || 0)}</span>
                        <span className="summary-label">⏳ Pendiente</span>
                    </div>
                    <div className="summary-card sessions">
                        <span className="summary-value">{weekData.summary?.totalSessions || 0}</span>
                        <span className="summary-label">Sesiones</span>
                    </div>
                </div>

                {/* Therapist Filter */}
                <div className="filter-bar">
                    <label>Filtrar por terapeuta:</label>
                    <select
                        value={filterTherapist}
                        onChange={(e) => setFilterTherapist(e.target.value)}
                        className="therapist-filter"
                    >
                        <option value="all">Todos</option>
                        {/* Get unique therapist names from sessions */}
                        {[...new Set(weekData.byTherapist?.map(t => t.therapistName) || [])]
                            .filter(name => name !== 'Sin asignar')
                            .sort()
                            .map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))
                        }
                    </select>
                </div>

                {/* Days as Cards */}
                <div className="days-grid">
                    {sortedDays.map((day) => (
                        <div
                            key={day.date}
                            className={`day-card ${expandedTherapist === day.date ? 'expanded' : ''}`}
                            onClick={() => setExpandedTherapist(expandedTherapist === day.date ? null : day.date)}
                        >
                            <div className="day-card-header">
                                <div className="day-info">
                                    <span className="day-name">{day.dayOfWeek}</span>
                                    <span className="day-date">{formatDate(day.date)}</span>
                                </div>
                                <div className="day-stats">
                                    <span className="day-sessions">{day.sessions.length} sesiones</span>
                                    <span className="day-amount">{formatCurrency(day.totalAmount)}</span>
                                </div>
                                <span className="expand-icon">{expandedTherapist === day.date ? '▲' : '▼'}</span>
                            </div>

                            {expandedTherapist === day.date && (
                                <div className="day-sessions-list" onClick={(e) => e.stopPropagation()}>
                                    {day.sessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className={`session-item ${session.paymentStatus}`}
                                            style={{
                                                borderLeftColor: session.therapistColor,
                                                background: `linear-gradient(135deg, ${session.therapistColor}15, white)`
                                            }}
                                        >
                                            <div className="session-card-header">
                                                <div className="session-time-col">
                                                    <span className="session-time">{session.startTime}</span>
                                                    <span className="session-duration">{session.durationMinutes} min</span>
                                                </div>
                                                <span className={`session-status ${session.paymentStatus}`}>
                                                    {session.paymentStatus === 'bizum' && '💳 Bizum'}
                                                    {session.paymentStatus === 'cash' && '💵 Efectivo'}
                                                    {session.paymentStatus === 'pending' && '⏳ Pendiente'}
                                                </span>
                                            </div>
                                            <div className="session-info-col">
                                                <span className="session-title">{session.title}</span>
                                                <span className="session-therapist" style={{ color: session.therapistColor }}>
                                                    {session.therapistName}
                                                </span>
                                            </div>
                                            <div className="session-card-footer">
                                                <span className="session-price">{formatCurrency(session.price)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {sortedDays.length === 0 && (
                    <p className="no-sessions">No hay sesiones para esta semana</p>
                )}
            </div>
        );
    };

    // === WEEK DETAIL VIEW (THERAPIST) ===
    const renderWeekDetailTherapist = () => {
        if (!weekData) return null;

        return (
            <div className="billing-detail therapist-view">
                <div className="billing-header">
                    <button className="btn-back-billing" onClick={handleBack}>← Volver</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h2>💰 Mis Sesiones - Semana {weekData.week?.number}</h2>
                        <button className="btn-history" onClick={handleTherapistHistoryClick}>
                            📜 Ver Mi Historial
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="billing-summary-cards">
                    <div className="summary-card total">
                        <span className="summary-value">{formatCurrency(weekData.summary?.totalAmount || 0)}</span>
                        <span className="summary-label">Total</span>
                    </div>
                    <div className="summary-card paid">
                        <span className="summary-value">{formatCurrency(weekData.summary?.paidAmount || 0)}</span>
                        <span className="summary-label">Cobrado</span>
                    </div>
                    <div
                        className="summary-card pending clickable"
                        onClick={handlePendingClick}
                        title="Gestionar Pagos de esta semana"
                    >
                        <span className="summary-value">{formatCurrency(weekData.summary?.pendingAmount || 0)}</span>
                        <span className="summary-label">Pendiente</span>
                    </div>
                </div>

                {/* Sessions as Cards */}
                <div className="my-sessions-list">
                    {weekData.sessions?.map((session) => (
                        <div key={session.id} className={`my-session-card ${session.paymentStatus}`}>
                            <div className="session-info">
                                <div className="session-datetime">
                                    <strong>{session.dayOfWeek}</strong> {formatDate(session.date)}
                                    <span className="session-time">{session.startTime} - {session.endTime}</span>
                                </div>
                                <div className="session-patient">{session.title}</div>
                                <div className="session-price-tag">{formatCurrency(session.price)}</div>
                            </div>
                            <div className="payment-options read-only">
                                <span className={`status-badge ${session.paymentStatus}`}>
                                    {session.paymentStatus === 'bizum' && '🏦 Transferencia'}
                                    {session.paymentStatus === 'transfer' && '🏦 Transferencia'}
                                    {session.paymentStatus === 'cash' && '💵 Efectivo'}
                                    {session.paymentStatus === 'pending' && '⏳ Pendiente'}
                                    {session.paymentStatus === 'cancelled' && '❌ Cancelada'}
                                </span>
                            </div>

                        </div>
                    ))}

                    {(!weekData.sessions || weekData.sessions.length === 0) && (
                        <p className="no-sessions">No hay sesiones para esta semana</p>
                    )}
                </div>
            </div>
        );
    };

    // === GLOBAL PAYMENT VIEW ===
    const renderGlobalPayments = () => {
        // Filter by Therapist (Frontend name match) an STATUS
        const visibleSessions = globalSessions.filter(session => {
            // Exclude non-billable sessions (libre/anulada)
            if (session.isLibre) return false;

            // 1. Filter by Therapist
            if (filterTherapist !== 'all') {
                // Admin sees names, Therapist has restricted view from backend anyway, but this checks frontend match just in case
                if (user.role === 'admin' && session.therapistName !== filterTherapist) {
                    return false;
                }
            }

            // 2. Filter by Status
            if (filterStatus !== 'all') {
                const isPaid = session.paymentStatus === 'transfer' || session.paymentStatus === 'cash' || session.paymentStatus === 'bizum';
                const isPending = session.paymentStatus === 'pending';
                // Note: Cancelled is hidden from totals usually, but let's include 'cancelled' in 'paid' bucket? Or separate? 
                // User asked for "Pagados" and "Pendientes". Cancelled is neither, or "Finalized".
                // Let's assume 'Paid' = Transfer/Cash/Bizum. 'Pending' = Pending. 

                if (filterStatus === 'paid' && !isPaid) return false;
                if (filterStatus === 'pending' && !isPending) return false;
            }

            return true;
        });

        // Calculate Totals for VISIBLE sessions
        const summary = visibleSessions.reduce((acc, s) => {
            if (s.paymentStatus === 'cancelled') return acc; // Don't count cancelled in money
            acc.total += s.price;
            if (s.paymentStatus === 'pending') acc.pending += s.price;
            else acc.paid += s.price;
            return acc;
        }, { total: 0, pending: 0, paid: 0 });

        // Get unique therapist names for filter dropdown
        const therapistNames = [...new Set(globalSessions.map(s => s.therapistName))].sort();

        return (
            <div className="billing-detail global-payment-view">

                {/* Global Summary Dashboard */}
                <div className="billing-summary-cards" style={{ marginBottom: '20px' }}>
                    <div className="summary-card total">
                        <span className="summary-value">{formatCurrency(summary.total)}</span>
                        <span className="summary-label">Total Visible</span>
                    </div>
                    <div className="summary-card paid">
                        <span className="summary-value">{formatCurrency(summary.paid)}</span>
                        <span className="summary-label">✅ Pagado</span>
                    </div>
                    <div className="summary-card pending">
                        <span className="summary-value">{formatCurrency(summary.pending)}</span>
                        <span className="summary-label">⏳ Pendiente</span>
                    </div>
                </div>

                <div className="global-payment-filters">
                    <div className="date-range">
                        <label>Desde: <input type="date" value={globalStartDate} onChange={e => setGlobalStartDate(e.target.value)} /></label>
                        <label>Hasta: <input type="date" value={globalEndDate} onChange={e => setGlobalEndDate(e.target.value)} /></label>
                    </div>

                    <div className="status-filter">
                        <label>Estado: </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="therapist-select"
                        >
                            <option value="all">Todos</option>
                            <option value="pending">⏳ Pendientes</option>
                            <option value="paid">✅ Pagados</option>
                        </select>
                    </div>

                    {user.role === 'admin' && (
                        <div className="therapist-filter">
                            <label>Terapeuta: </label>
                            <select
                                value={filterTherapist}
                                onChange={(e) => setFilterTherapist(e.target.value)}
                                className="therapist-select"
                            >
                                <option value="all">Todos</option>
                                {therapistNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="global-sessions-list">
                    {visibleSessions.length === 0 ? (
                        <p className="no-sessions">No hay sesiones en este periodo.</p>
                    ) : (
                        visibleSessions.map(session => (
                            <div key={session.id} className={`pending-session-card ${session.paymentStatus} global-card`}>
                                <div className="pending-session-info">
                                    <div className="session-date-row">
                                        <span className="session-date">{formatDate(session.date)}</span>
                                        <span className="session-therapist-tag" style={{ backgroundColor: session.therapistColor, color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', marginLeft: '8px' }}>
                                            {session.therapistName}
                                        </span>
                                    </div>
                                    <span className="session-title">{session.title}</span>
                                    <span className="session-price">{formatCurrency(session.price)}</span>
                                    {session.paymentStatus !== 'pending' && (
                                        <span className={`status-badge ${session.paymentStatus} mini-badge`}>
                                            {session.paymentStatus === 'transfer' || session.paymentStatus === 'bizum' ? '🏦 Transferencia' :
                                                session.paymentStatus === 'cash' ? '💵 Efectivo' : '❌ Cancelada'}
                                            {session.paymentDate && <span className="payment-date-small"> ({formatDate(session.paymentDate)})</span>}
                                        </span>
                                    )}
                                </div>

                                <div className="payment-actions">
                                    {/* Permission Check: If Therapist and Payment is Paid (not pending), show Read Only */}
                                    {(user.role !== 'admin' && session.paymentStatus !== 'pending') ? (
                                        <span className="read-only-msg">✅ Procesado</span>
                                    ) : (
                                        transferDateSessionId === session.id ? (
                                            <div className="transfer-date-input">
                                                <input
                                                    type="date"
                                                    value={transferDateValue}
                                                    onChange={(e) => setTransferDateValue(e.target.value)}
                                                    className="date-input-mini"
                                                    autoFocus
                                                />
                                                <button className="btn-confirm-transfer" onClick={() => markPayment(session.id, 'transfer', transferDateValue)} disabled={!transferDateValue}>✅</button>
                                                <button className="btn-cancel-transfer" onClick={() => setTransferDateSessionId(null)}>✖️</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    className={`btn-pay transfer ${session.paymentStatus === 'transfer' ? 'active' : ''}`}
                                                    onClick={() => handleTransferClick(session.id)}
                                                    title="Marcar como Transferencia"
                                                >🏦</button>
                                                <button
                                                    className={`btn-pay cash ${session.paymentStatus === 'cash' ? 'active' : ''}`}
                                                    onClick={() => markPayment(session.id, 'cash')}
                                                    title="Marcar como Efectivo"
                                                >💵</button>
                                                <button
                                                    className={`btn-pay cancel ${session.paymentStatus === 'cancelled' ? 'active' : ''}`}
                                                    onClick={() => markPayment(session.id, 'cancelled')}
                                                    title="Cancelar (No cobrar)"
                                                >❌</button>
                                            </>
                                        ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    // === PENDING SESSIONS VIEW ===
    const renderPendingView = () => {
        if (!weekData) return null;

        // Group pending sessions by therapist and date
        const pendingByTherapist = {};
        weekData.byTherapist?.forEach(therapist => {
            therapist.sessions?.forEach(session => {
                // Skip libre events only (show paid sessions to allow Admin review)
                if (session.isLibre) return;

                const therapistName = session.therapistName || therapist.therapistName;
                if (!pendingByTherapist[therapistName]) {
                    pendingByTherapist[therapistName] = {
                        name: therapistName,
                        color: session.therapistColor || therapist.color || '#e0e0e0',
                        days: {},
                        totalSessions: 0,
                        totalAmount: 0
                    };
                }

                const dayKey = session.date;
                if (!pendingByTherapist[therapistName].days[dayKey]) {
                    pendingByTherapist[therapistName].days[dayKey] = {
                        date: session.date,
                        dayOfWeek: session.dayOfWeek,
                        sessions: [],
                        totalAmount: 0
                    };
                }

                pendingByTherapist[therapistName].days[dayKey].sessions.push(session);
                pendingByTherapist[therapistName].days[dayKey].totalAmount += session.price;
                pendingByTherapist[therapistName].totalSessions++;
                pendingByTherapist[therapistName].totalAmount += session.price;
            });
        });

        //Sort by pending amount? or filtering?
        const sortedTherapists = Object.values(pendingByTherapist).sort((a, b) =>
            b.totalAmount - a.totalAmount
        );

        return (
            <div className="billing-detail pending-view">
                <div className="billing-header">
                    <button className="btn-back-billing" onClick={() => setView('detail')}>← Volver</button>
                    <h2>💰 Gestión de Pagos</h2>
                </div>

                {/* Always show calendar iframe in Pending View for checks */}
                <div className="embedded-calendar-pending">
                    <iframe
                        src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CALENDAR_ID)}&ctz=Europe%2FMadrid&mode=MONTH`}
                        style={{ border: 0, width: '100%', height: '400px', marginBottom: '20px', borderRadius: '8px' }}
                        title="Google Calendar Month"
                    />
                </div>

                {sortedTherapists.length === 0 ? (
                    <div className="no-pending">
                        <p>🎉 ¡No hay sesiones!</p>
                    </div>
                ) : (
                    <div className="pending-therapists">
                        {sortedTherapists.map(therapist => (
                            <div key={therapist.name} className="pending-therapist-card">
                                <div
                                    className="pending-therapist-header"
                                    style={{ borderLeftColor: therapist.color }}
                                >
                                    <span className="therapist-name">{therapist.name}</span>
                                    <div className="therapist-stats">
                                        <span className="pending-count">{therapist.totalSessions} sesiones</span>
                                        <span className="pending-amount">{formatCurrency(therapist.totalAmount)}</span>
                                    </div>
                                </div>
                                <div className="pending-days">
                                    {Object.values(therapist.days)
                                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                                        .map(day => (
                                            <div key={day.date} className="pending-day">
                                                <div className="pending-day-header">
                                                    <span className="pending-date">{day.dayOfWeek} {formatDate(day.date)}</span>
                                                    <span className="pending-day-count">{day.sessions.length} sesiones</span>
                                                </div>
                                                <div className="pending-sessions">
                                                    {day.sessions.map(session => (
                                                        <div key={session.id} className={`pending-session-card ${session.paymentStatus}`}>
                                                            <div className="pending-session-info">
                                                                <span className="session-time">{session.startTime}</span>
                                                                <span className="session-title">{session.title}</span>
                                                                <span className="session-price">{formatCurrency(session.price)}</span>
                                                                {session.paymentStatus !== 'pending' && (
                                                                    <span className={`status-badge ${session.paymentStatus} mini-badge`}>
                                                                        {session.paymentStatus === 'transfer' || session.paymentStatus === 'bizum' ? '🏦' :
                                                                            session.paymentStatus === 'cash' ? '💵' : '❌'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="payment-actions">
                                                                {transferDateSessionId === session.id ? (
                                                                    <div className="transfer-date-input">
                                                                        <input
                                                                            type="date"
                                                                            value={transferDateValue}
                                                                            onChange={(e) => setTransferDateValue(e.target.value)}
                                                                            className="date-input-mini"
                                                                            autoFocus
                                                                        />
                                                                        <button
                                                                            className="btn-confirm-transfer"
                                                                            onClick={() => markPayment(session.id, 'transfer', transferDateValue)}
                                                                            disabled={!transferDateValue}
                                                                        >✅</button>
                                                                        <button
                                                                            className="btn-cancel-transfer"
                                                                            onClick={() => setTransferDateSessionId(null)}
                                                                        >✖️</button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            className={`btn-pay transfer ${session.paymentStatus === 'transfer' ? 'active' : ''}`}
                                                                            onClick={() => handleTransferClick(session.id)}
                                                                            title="Marcar como Transferencia"
                                                                        >🏦</button>
                                                                        <button
                                                                            className={`btn-pay cash ${session.paymentStatus === 'cash' ? 'active' : ''}`}
                                                                            onClick={() => markPayment(session.id, 'cash')}
                                                                            title="Marcar como Efectivo"
                                                                        >💵</button>
                                                                        <button
                                                                            className={`btn-pay cancel ${session.paymentStatus === 'cancelled' ? 'active' : ''}`}
                                                                            onClick={() => markPayment(session.id, 'cancelled')}
                                                                            title="Cancelar (No cobrar)"
                                                                        >❌</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };


    if (loading) {
        return <div className="billing-loading">Cargando...</div>;
    }

    return (
        <div className="billing-container">
            {/* Mode Toggle */}
            <div className="billing-mode-toggle">
                <button
                    className={`btn-mode ${billingMode === 'calendar' ? 'active' : ''}`}
                    onClick={() => setBillingMode('calendar')}
                >
                    📅 Calendario y Horas
                </button>
                <button
                    className={`btn-mode ${billingMode === 'payments' ? 'active' : ''}`}
                    onClick={() => setBillingMode('payments')}
                >
                    💰 Gestión de Pagos
                </button>
            </div>

            {billingMode === 'payments' ? (
                renderGlobalPayments()
            ) : (
                <>
                    {/* Calendar Toggle Button */}
                    <div className="calendar-toggle-section">
                        <button
                            className={`btn-calendar-toggle ${showCalendar ? 'active' : ''}`}
                            onClick={() => setShowCalendar(!showCalendar)}
                        >
                            {showCalendar ? '📅 Ocultar Calendario' : '📅 Mostrar Calendario'}
                        </button>
                    </div>

                    {/* Embedded Calendar */}
                    {showCalendar && (
                        <div className="embedded-calendar">
                            <iframe
                                src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CALENDAR_ID)}&ctz=Europe%2FMadrid&mode=WEEK`}
                                style={{ border: 0, width: '100%', height: '600px' }}
                                title="Google Calendar"
                            />
                        </div>
                    )}

                    {view === 'months' && renderMonths()}
                    {view === 'weeks' && renderWeeks()}
                    {view === 'detail' && (user.role === 'admin' ? renderWeekDetailAdmin() : renderWeekDetailTherapist())}
                    {view === 'pending' && renderPendingView()}
                </>
            )}
        </div>
    );
};

export default BillingTab;
