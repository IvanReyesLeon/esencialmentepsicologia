import React, { useState, useEffect } from 'react';
import { API_ROOT } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ConfirmModal from './ConfirmModal';
import './BillingTab.css';
import './BillingDashboard.css'; // Reusing styling if needed

const API_URL = `${API_ROOT}/api`;
const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

const BillingTab = ({ user }) => {
    const [view, setView] = useState('months'); // 'months' | 'weeks' | 'detail' | 'pending' | 'invoice'
    const [billingMode, setBillingMode] = useState('calendar'); // 'calendar' | 'payments' | 'invoice'
    const [globalSessions, setGlobalSessions] = useState([]);

    // Default to current month
    const [globalStartDate, setGlobalStartDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
    });
    const [globalEndDate, setGlobalEndDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
    });

    // Invoice Submission State
    const [invoiceSubmitted, setInvoiceSubmitted] = useState(false);
    const [submissionData, setSubmissionData] = useState(null);

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

    // Price editing states
    const [editingPriceSessionId, setEditingPriceSessionId] = useState(null);
    const [editingPriceValue, setEditingPriceValue] = useState('');
    const [sessionPrices, setSessionPrices] = useState({}); // Track modified prices locally

    // Revoke modal states
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [sessionToRevoke, setSessionToRevoke] = useState(null);
    const [recentlyRevokedId, setRecentlyRevokedId] = useState(null); // To highlight revoked session

    // Invoice generation states
    const [invoiceYear, setInvoiceYear] = useState(new Date().getFullYear());
    const [invoiceMonth, setInvoiceMonth] = useState(new Date().getMonth());
    const [invoiceSessions, setInvoiceSessions] = useState([]);
    const [invoiceHasPending, setInvoiceHasPending] = useState(false);
    const [invoicePendingCount, setInvoicePendingCount] = useState(0);
    const [invoicePendingMessage, setInvoicePendingMessage] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false); // State for custom modal
    const [therapistPercentage, setTherapistPercentage] = useState(60);
    const [irpf, setIrpf] = useState(15);
    const [iva, setIva] = useState(0); // New state for IVA
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [excludedSessions, setExcludedSessions] = useState(new Set()); // Track ID of excluded sessions

    // Admin Review states
    const [reviewSummary, setReviewSummary] = useState(null);
    const [cashConfirmAmount, setCashConfirmAmount] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [selectedTherapistId, setSelectedTherapistId] = useState(null); // For review API calls
    const [showReviewDetails, setShowReviewDetails] = useState(null); // 'cash' | 'transfer' | null

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const currentMonth = new Date().getMonth();

    // State for review confirmation modal
    const [reviewConfirm, setReviewConfirm] = useState({ isOpen: false, session: null, isReviewed: false });
    // State for error messages (custom modal)
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });

    // Derived Summary Calculation
    const getDerivedReviewSummary = () => {
        if (filterTherapist === 'all') return null;

        const sessionsToCheck = globalSessions.filter(s =>
            s.therapistName === filterTherapist &&
            ['cash', 'transfer'].includes(s.paymentStatus)
        );

        const cashSessions = sessionsToCheck.filter(s => s.paymentStatus === 'cash');
        const transferSessions = sessionsToCheck.filter(s => s.paymentStatus === 'transfer');

        const cashPending = cashSessions.filter(s => !s.reviewedAt);
        const transferPending = transferSessions.filter(s => !s.reviewedAt);

        return {
            cash: {
                totalCount: cashSessions.length,
                pendingCount: cashPending.length,
                pendingAmount: cashPending.reduce((sum, s) => sum + Number(s.modifiedPrice ?? s.originalPrice ?? s.price ?? 0), 0),
                sessions: cashSessions,
                pendingSessions: cashPending
            },
            transfer: {
                totalCount: transferSessions.length,
                pendingCount: transferPending.length,
                pendingAmount: transferPending.reduce((sum, s) => sum + Number(s.modifiedPrice ?? s.originalPrice ?? s.price ?? 0), 0),
                sessions: transferSessions,
                pendingSessions: transferPending
            }
        };
    };

    // Toggle logic split for Modal
    const handleToggleReview = (session, isReviewed) => {
        if (isReviewed) {
            // Unmarking -> Show modal
            setReviewConfirm({ isOpen: true, session, isReviewed });
        } else {
            // Marking -> Do it directly
            executeToggleReview(session, isReviewed);
        }
    };

    const confirmCashPayments = async () => {
        try {
            const derivedSummary = getDerivedReviewSummary();
            if (!derivedSummary || derivedSummary.cash.pendingSessions.length === 0) return;

            // Handle comma as decimal separator and parse
            const amountStr = cashConfirmAmount.replace(',', '.');
            const numericAmount = parseFloat(amountStr);

            if (isNaN(numericAmount)) {
                setErrorModal({
                    isOpen: true,
                    title: 'Formato inválido',
                    message: 'Por favor, introduce una cantidad válida.'
                });
                return;
            }

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/review-payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    therapistId: derivedSummary.cash.sessions[0].therapistId, // Take from first session
                    paymentType: 'cash',
                    confirmedAmount: numericAmount, // Send manual input
                    eventIds: derivedSummary.cash.pendingSessions.map(s => s.id) // Send specific IDs
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorModal({
                    isOpen: true,
                    title: 'Error de validación',
                    message: data.message || 'Error al revisar pagos'
                });
                return;
            }

            // Success -> Update local state
            const updatedSessions = globalSessions.map(s => {
                if (derivedSummary.cash.pendingSessions.some(pending => pending.id === s.id)) {
                    return { ...s, reviewedAt: new Date().toISOString() };
                }
                return s;
            });
            setGlobalSessions(updatedSessions);
            setCashConfirmAmount('');

            // Show success toast or small feedback if needed, but UI update is enough
        } catch (error) {
            console.error('Error confirming cash:', error);
            setErrorModal({
                isOpen: true,
                title: 'Error del sistema',
                message: 'Error de conexión al revisar pagos'
            });
        }
    };

    const confirmTransferPayments = async () => {
        try {
            const derivedSummary = getDerivedReviewSummary();
            if (!derivedSummary || derivedSummary.transfer.pendingSessions.length === 0) return;

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/review-payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    therapistId: derivedSummary.transfer.sessions[0].therapistId,
                    paymentType: 'transfer',
                    eventIds: derivedSummary.transfer.pendingSessions.map(s => s.id)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorModal({
                    isOpen: true,
                    title: 'Error de validación',
                    message: data.message || 'Error al confirmar transferencias'
                });
                return;
            }

            // Success -> Update local state
            const updatedSessions = globalSessions.map(s => {
                if (derivedSummary.transfer.pendingSessions.some(pending => pending.id === s.id)) {
                    return { ...s, reviewedAt: new Date().toISOString() };
                }
                return s;
            });
            setGlobalSessions(updatedSessions);

        } catch (error) {
            console.error('Error confirming transfer:', error);
            setErrorModal({
                isOpen: true,
                title: 'Error del sistema',
                message: 'Error de conexión al revisar transferencias'
            });
        }
    };

    const executeToggleReview = async (session, isReviewed) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/review-toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId: session.id,
                    reviewed: !isReviewed // Reviewing if !isReviewed, Unreviewing if isReviewed
                })
            });

            if (res.ok) {
                // Update local state locally
                const updatedSessions = globalSessions.map(s => {
                    if (s.id === session.id) {
                        return {
                            ...s,
                            reviewedAt: !isReviewed ? new Date().toISOString() : null
                        };
                    }
                    return s;
                });
                setGlobalSessions(updatedSessions);
            }
        } catch (error) {
            console.error('Error toggling review:', error);
            alert('Error al actualizar el estado de revisión');
        }
    };

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

    // Poll for updates every 10 seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (billingMode === 'payments') {
                // Silent update for global list
                const token = localStorage.getItem('token');
                let url = `${API_URL}/admin/billing/global?startDate=${globalStartDate}&endDate=${globalEndDate}`;
                fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => res.json())
                    .then(data => setGlobalSessions(data.sessions || []))
                    .catch(err => console.error('Polling global error:', err));
            } else if (billingMode === 'calendar' && view === 'detail' && weekData && selectedWeek) {
                // Silent update for week detail
                const token = localStorage.getItem('token');
                const endpoint = user.role === 'admin'
                    ? `${API_URL}/admin/billing/weekly?year=${selectedYear}&month=${selectedMonth}&week=${selectedWeek}`
                    : `${API_URL}/admin/billing/my-sessions?year=${selectedYear}&month=${selectedMonth}&week=${selectedWeek}`;

                fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => res.json())
                    .then(data => setWeekData(data))
                    .catch(err => console.error('Polling detail error:', err));
            }
        }, 10000); // 10 seconds

        return () => clearInterval(intervalId);
    }, [billingMode, view, globalStartDate, globalEndDate, selectedWeek, selectedYear, selectedMonth, weekData, user.role]);

    // Fetch invoice data when year/month changes
    useEffect(() => {
        if (billingMode === 'invoice') {
            fetchInvoiceData();
        }
    }, [invoiceYear, invoiceMonth, billingMode]);

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

    const markPayment = async (eventId, paymentType, paymentDate = null, session = null) => {
        try {
            const token = localStorage.getItem('token');
            // Include session data for history
            const bodyData = {
                paymentType,
                paymentDate,
                sessionDate: session?.date || null,
                sessionTitle: session?.title || null,
                originalPrice: session?.price || 55,
                modifiedPrice: sessionPrices[eventId] || null,
                targetTherapistId: session?.therapistId || null // For admin to mark other therapists' sessions
            };

            await fetch(`${API_URL}/admin/billing/sessions/${eventId}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });
            // Refresh data
            if (billingMode === 'payments') {
                fetchGlobalSessions();
                // Also refresh review summary if viewing paid sessions for a therapist
                if (selectedTherapistId && filterStatus === 'paid') {
                    fetchReviewSummary(selectedTherapistId);
                }
            } else {
                fetchWeekDetail();
            }
            setTransferDateSessionId(null);
            setTransferDateValue('');
        } catch (error) {
            console.error('Error marking payment:', error);
        }
    };

    // Update session price (before assigning payment status)
    const updateSessionPrice = async (eventId, newPrice, resetToOriginal = false, session = null) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/sessions/${eventId}/price`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    modifiedPrice: resetToOriginal ? null : parseFloat(newPrice),
                    resetToOriginal,
                    sessionDate: session?.date || null,
                    sessionTitle: session?.title || null,
                    originalPrice: session?.price || 55,
                    targetTherapistId: session?.therapistId || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                // Update local state
                if (resetToOriginal) {
                    setSessionPrices(prev => {
                        const updated = { ...prev };
                        delete updated[eventId];
                        return updated;
                    });
                } else {
                    setSessionPrices(prev => ({ ...prev, [eventId]: parseFloat(newPrice) }));
                }
                // Refresh data
                if (billingMode === 'payments') {
                    fetchGlobalSessions();
                } else {
                    fetchWeekDetail();
                }
            } else {
                const error = await res.json();
                alert(error.message || 'Error al actualizar precio');
            }

            setEditingPriceSessionId(null);
            setEditingPriceValue('');
        } catch (error) {
            console.error('Error updating price:', error);
        }
    };

    // Admin: Revoke price change and reset to pending (for review)
    const handleRevokeClick = (session) => {
        setSessionToRevoke(session);
        setShowRevokeModal(true);
    };

    const confirmRevokePriceChange = async () => {
        const session = sessionToRevoke;
        if (!session) return;

        setShowRevokeModal(false);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/billing/sessions/${session.id}/revoke-price`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionDate: session.date,
                    sessionTitle: session.title,
                    originalPrice: session.originalPrice || 55,
                    targetTherapistId: session.therapistId
                })
            });

            if (res.ok) {
                // 1. Update local state immediately to reflect changes without waiting for fetch
                setGlobalSessions(prev => prev.map(s => {
                    if (s.id === session.id) {
                        return {
                            ...s,
                            price: session.originalPrice || 55, // Reset to original price
                            modifiedPrice: null,
                            paymentStatus: 'pending',
                            paymentDate: null
                        };
                    }
                    return s;
                }));

                // 2. Remove from local edited prices map
                setSessionPrices(prev => {
                    const updated = { ...prev };
                    delete updated[session.id];
                    return updated;
                });

                // 3. Highlight the revoked session
                setRecentlyRevokedId(session.id);
                // Clear highlight after 5 seconds
                setTimeout(() => setRecentlyRevokedId(null), 5000);

                // 4. Background refresh to ensure consistency
                fetchGlobalSessions();
            } else {
                const error = await res.json();
                alert(error.message || 'Error al revocar cambio');
            }
        } catch (error) {
            console.error('Error revoking price change:', error);
        } finally {
            setSessionToRevoke(null);
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

    // Fetch review summary for admin (unreviewed payments by therapist)
    const fetchReviewSummary = async (therapistId) => {
        if (!therapistId || user.role !== 'admin') return;
        try {
            setReviewLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${API_URL}/admin/billing/review-summary?therapistId=${therapistId}&startDate=${globalStartDate}&endDate=${globalEndDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            setReviewSummary(data.summary);
            setSelectedTherapistId(therapistId);
            setCashConfirmAmount('');
        } catch (error) {
            console.error('Error fetching review summary:', error);
        } finally {
            setReviewLoading(false);
        }
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

    const fetchInvoiceData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${API_URL}/admin/billing/monthly-sessions?year=${invoiceYear}&month=${invoiceMonth}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();

            // FIX: Check for error response (400) or hasPending flag
            if (!res.ok || data.hasPending || data.error) {
                // Has pending sessions - show warning
                setInvoiceHasPending(true);
                setInvoicePendingCount(data.pendingCount || 0);
                setInvoicePendingMessage(data.message || 'Tienes sesiones pendientes de revisar.');
                setInvoiceSessions([]);
            } else {
                // All sessions are ready for invoice
                setInvoiceHasPending(false);
                setInvoicePendingMessage('');
                setInvoiceSessions(data.sessions || []);
            }

            // Check if already submitted
            const statusRes = await fetch(
                `${API_URL}/admin/billing/invoice-status?year=${invoiceYear}&month=${invoiceMonth}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const statusData = await statusRes.json();
            if (statusData.submitted) {
                setInvoiceSubmitted(true);
                setSubmissionData(statusData.submission);
                // Load exclusions if any
                if (statusData.submission.excluded_session_ids) {
                    // Check if it's a string (JSON) or already an object
                    let exclusions = statusData.submission.excluded_session_ids;
                    if (typeof exclusions === 'string') {
                        try { exclusions = JSON.parse(exclusions); } catch (e) { exclusions = []; }
                    }
                    setExcludedSessions(new Set(exclusions));
                } else {
                    setExcludedSessions(new Set());
                }
            } else {
                setInvoiceSubmitted(false);
                setSubmissionData(null);
                setExcludedSessions(new Set());
            }

            // Fetch Therapist Configuration (Percentage & IRPF)
            const myDataRes = await fetch(`${API_URL}/admin/billing/my-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const myData = await myDataRes.json();
            if (myData && myData.percentage) {
                setTherapistPercentage(Number(myData.percentage));
            }
            // Assuming IRPF might also be configurable in the future, currently hardcoded or passed.
            // For now, only percentage is dynamic based on user request.

        } catch (error) {
            console.error('Error fetching invoice data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to toggle exclusion
    const toggleSessionExclusion = (sessionId) => {
        setExcludedSessions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sessionId)) {
                newSet.delete(sessionId);
            } else {
                newSet.add(sessionId);
            }
            return newSet;
        });
    };

    const submitInvoice = async () => {
        setShowConfirmModal(true);
    };

    const confirmSubmission = async () => {
        setShowConfirmModal(false);
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Recalculate totals based on active sessions (filtered by exclusion)
            const activeInvoiceSessions = invoiceSessions.filter(s => !excludedSessions.has(s.id));
            const activeSubtotal = activeInvoiceSessions.reduce((sum, s) => sum + (s.price || 0), 0);
            const centerPercentage = 100 - therapistPercentage;
            const activeCenterAmount = activeSubtotal * (centerPercentage / 100);
            const activeBaseDisponible = activeSubtotal * (therapistPercentage / 100);
            const activeIvaAmount = activeBaseDisponible * (iva / 100);
            const activeIrpfAmount = activeBaseDisponible * (irpf / 100);
            const activeTotalFactura = activeBaseDisponible + activeIvaAmount - activeIrpfAmount;

            const excludedArray = Array.from(excludedSessions);

            const res = await fetch(`${API_URL}/admin/billing/submit-invoice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    month: invoiceMonth,
                    year: invoiceYear,
                    subtotal: activeSubtotal,
                    center_percentage: centerPercentage,
                    center_amount: activeCenterAmount,
                    irpf_percentage: irpf,
                    irpf_amount: activeIrpfAmount,
                    iva_percentage: iva,
                    iva_amount: activeIvaAmount,
                    total_amount: activeTotalFactura,
                    invoice_number: invoiceNumber,
                    excluded_session_ids: excludedArray
                })
            });

            if (res.ok) {
                alert('✅ Factura presentada correctamente');
                // Refresh data
                fetchInvoiceData();
            } else {
                const error = await res.json();
                alert('❌ Error al presentar factura: ' + error.message);
            }
        } catch (error) {
            console.error('Error submitting invoice:', error);
            alert('❌ Error de conexión al presentar factura');
        } finally {
            setLoading(false);
        }
    };



    const handleInvoiceClick = () => {
        setBillingMode('invoice');
        setView('invoice');
        fetchInvoiceData();
    };

    const downloadInvoicePDF = async () => {
        try {
            // Fetch billing data
            const token = localStorage.getItem('token');
            const [therapistRes, centerRes] = await Promise.all([
                // Add timestamp to prevent caching of therapist data
                fetch(`${API_URL}/admin/billing/my-data?t=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                // Add timestamp to prevent caching of center data
                fetch(`${API_URL}/admin/billing/center-data?t=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const therapistData = await therapistRes.json();
            const centerData = await centerRes.json();

            const doc = new jsPDF();

            const activeInvoiceSessions = invoiceSessions.filter(s => !excludedSessions.has(s.id));

            // Calculate all values
            const subtotal = activeInvoiceSessions.reduce((sum, s) => sum + (s.price || 0), 0);
            const centerPercentage = 100 - therapistPercentage;
            const centerAmount = subtotal * (centerPercentage / 100);
            const baseDisponible = subtotal * (therapistPercentage / 100);
            const ivaAmount = baseDisponible * (iva / 100);
            const irpfAmount = baseDisponible * (irpf / 100);
            const totalFactura = baseDisponible + ivaAmount - irpfAmount;

            // Header with orange background
            doc.setFillColor(255, 140, 66);
            doc.rect(0, 0, 210, 40, 'F');

            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('FACTURA', 105, 15, { align: 'center' });

            // Invoice number (if provided)
            if (invoiceNumber) {
                doc.setFontSize(14);
                doc.text(`Nº ${invoiceNumber}`, 105, 24, { align: 'center' });
            }

            // Date info
            doc.setFontSize(12);
            const monthName = months[invoiceMonth];
            doc.text(`${monthName} ${invoiceYear}`, 105, invoiceNumber ? 33 : 30, { align: 'center' });

            // Reset text color
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);

            // Left column - "FACTURAR A" (Center Data)
            doc.setFont(undefined, 'bold');
            doc.text('FACTURAR A:', 14, 50);
            doc.setFont(undefined, 'normal');

            let yPos = 56;
            if (centerData.name) {
                doc.text(centerData.name, 14, yPos);
                yPos += 5;
            }
            if (centerData.legal_name) {
                doc.text(`(${centerData.legal_name})`, 14, yPos);
                yPos += 5;
            }
            if (centerData.nif) {
                doc.text(centerData.nif, 14, yPos);
                yPos += 5;
            }
            if (centerData.address_line1) {
                doc.text(centerData.address_line1, 14, yPos);
                yPos += 5;
            }
            if (centerData.address_line2) {
                doc.text(centerData.address_line2, 14, yPos);
                yPos += 5;
            }
            const cityPostal = [centerData.postal_code, centerData.city].filter(Boolean).join(' ');
            if (cityPostal) {
                doc.text(cityPostal, 14, yPos);
            }

            // Right column - "DE" (Therapist Data)
            doc.setFont(undefined, 'bold');
            doc.text('DE:', 120, 50);
            doc.setFont(undefined, 'normal');

            yPos = 56;
            if (therapistData.full_name) {
                doc.text(therapistData.full_name, 120, yPos);
                yPos += 5;
            }
            if (therapistData.nif) {
                doc.text(therapistData.nif, 120, yPos);
                yPos += 5;
            }
            if (therapistData.address_line1) {
                doc.text(therapistData.address_line1, 120, yPos);
                yPos += 5;
            }
            if (therapistData.address_line2) {
                doc.text(therapistData.address_line2, 120, yPos);
                yPos += 5;
            }
            const therapistCityPostal = [therapistData.postal_code, therapistData.city].filter(Boolean).join(' ');
            if (therapistCityPostal) {
                doc.text(therapistCityPostal, 120, yPos);
                yPos += 5;
            }
            if (therapistData.iban) {
                doc.text(therapistData.iban, 120, yPos);
            }

            // Group sessions by price
            const sessionsByPrice = {};
            invoiceSessions.forEach(session => {
                const price = session.price || 0;
                if (!sessionsByPrice[price]) {
                    sessionsByPrice[price] = { count: 0, price: price };
                }
                sessionsByPrice[price].count++;
            });

            // Create table data with grouped sessions
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
                headStyles: {
                    fillColor: [255, 140, 66],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 10
                }
            });

            // Summary section
            let finalY = doc.lastAutoTable.finalY + 15;

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');

            // Summary lines
            doc.text('SUBTOTAL:', 120, finalY);
            doc.text(formatCurrency(subtotal), 190, finalY, { align: 'right' });

            finalY += 10;
            doc.setFont(undefined, 'normal');
            doc.text(`- Centro (${centerPercentage}%):`, 120, finalY);
            doc.text(formatCurrency(centerAmount), 190, finalY, { align: 'right' });

            finalY += 8;
            doc.setFont(undefined, 'bold');
            doc.text(`BASE DISPONIBLE (${therapistPercentage}%):`, 120, finalY);
            doc.text(formatCurrency(baseDisponible), 190, finalY, { align: 'right' });

            finalY += 8;
            doc.setFont(undefined, 'normal');
            doc.text(`- ${irpf}% IRPF:`, 120, finalY);
            doc.text(formatCurrency(irpfAmount), 190, finalY, { align: 'right' });

            // Total line
            finalY += 10;
            doc.setDrawColor(255, 140, 66);
            doc.setLineWidth(0.5);
            doc.line(120, finalY, 195, finalY);
            finalY += 8;

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 140, 66);
            doc.text('TOTAL FACTURA:', 120, finalY);
            doc.text(formatCurrency(totalFactura), 190, finalY, { align: 'right' });

            // Legal text
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.setFont(undefined, 'italic');
            const legalText = 'Operación exenta según lo dispuesto en el art. 20. Uno. 3 de la Ley 37/1992 de 28 de diciembre. del Impuesto sobre el Valor Añadido.';
            const legalLines = doc.splitTextToSize(legalText, 180);
            doc.text(legalLines, 105, 270, { align: 'center' });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'normal');
            doc.text('Esencialmente Psicología - www.esencialmentepsicologia.com', 105, 285, { align: 'center' });

            // Save the PDF
            const fileName = `Factura_${monthName}_${invoiceYear}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Verifica que tus datos estén completos.');
        }
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
                        <span className="summary-sessions">({weekData.summary?.totalSessions || 0} sesiones)</span>
                        <span className="summary-label">Total Esperado</span>
                    </div>
                    <div className="summary-card paid">
                        <span className="summary-value">{formatCurrency(weekData.summary?.paidAmount || 0)}</span>
                        <span className="summary-sessions">({weekData.summary?.paidSessions || 0} sesiones)</span>
                        <span className="summary-label">✅ Pagado</span>
                    </div>
                    <div
                        className="summary-card pending clickable"
                        onClick={handlePendingClick}
                        title="Gestionar Pagos de esta semana"
                    >
                        <span className="summary-value">{formatCurrency(weekData.summary?.pendingAmount || 0)}</span>
                        <span className="summary-sessions">({weekData.summary?.pendingSessions || 0} sesiones)</span>
                        <span className="summary-label">⏳ Pendiente</span>
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
                                                    {session.paymentStatus === 'unpaid' && (
                                                        <span className="status-badge status-unpaid">
                                                            ❌€ No Pagado
                                                        </span>
                                                    )}
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

                {/* Summary - Mostrar número de sesiones, no euros */}
                <div className="billing-summary-cards">
                    <div className="summary-card total">
                        <span className="summary-value">{weekData.summary?.totalSessions || 0}</span>
                        <span className="summary-label">Sesiones Totales</span>
                    </div>
                    <div className="summary-card paid">
                        <span className="summary-value">{weekData.summary?.paidSessions || 0}</span>
                        <span className="summary-label">✅ Revisadas</span>
                    </div>
                    <div
                        className="summary-card pending clickable"
                        onClick={handlePendingClick}
                        title="Ver sesiones pendientes de supervisar"
                    >
                        <span className="summary-value">{weekData.summary?.pendingSessions || 0}</span>
                        <span className="summary-label">⏳ Pendientes</span>
                    </div>
                </div>

                {/* Tabs para sesiones facturables vs no facturables */}
                {(() => {
                    const billableSessions = weekData.sessions?.filter(s => s.price > 0 && s.paymentStatus !== 'cancelled') || [];
                    const nonBillableSessions = weekData.sessions?.filter(s => s.price === 0 || s.paymentStatus === 'cancelled') || [];

                    return (
                        <>
                            {nonBillableSessions.length > 0 && (
                                <div className="session-tabs" style={{ marginBottom: '15px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                        📋 {billableSessions.length} sesiones facturables
                                        {nonBillableSessions.length > 0 && (
                                            <span style={{ marginLeft: '15px', color: '#999' }}>
                                                | 🚫 {nonBillableSessions.length} no facturables (libres, anuladas)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}

                            {/* Sessions as Cards - Solo las facturables */}
                            <div className="my-sessions-list">
                                {billableSessions.map((session) => (
                                    <div key={session.id} className={`my-session-card ${session.paymentStatus}`}>
                                        <div className="session-info">
                                            <div className="session-datetime">
                                                <strong>{session.dayOfWeek}</strong> {formatDate(session.date)}
                                                <span className="session-time">{session.startTime} - {session.endTime}</span>
                                            </div>
                                            <div className="session-patient">{session.title}</div>
                                        </div>
                                        <div className="payment-options read-only">
                                            <span className={`status-badge ${(['cash', 'transfer', 'bizum'].includes(session.paymentStatus) && !session.reviewedAt) ? 'pending' : session.paymentStatus}`}>
                                                {['cash', 'transfer', 'bizum'].includes(session.paymentStatus) ? (
                                                    session.reviewedAt ? '✅ Procesado' : '⏳ En revisión'
                                                ) : (
                                                    session.paymentStatus === 'pending' ? '⏳ Pendiente' : ''
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {billableSessions.length === 0 && (
                                    <p className="no-sessions">No hay sesiones facturables esta semana</p>
                                )}
                            </div>

                            {/* Sesiones no facturables en sección colapsada */}
                            {nonBillableSessions.length > 0 && (
                                <details style={{ marginTop: '20px' }}>
                                    <summary style={{ cursor: 'pointer', padding: '10px', background: '#f5f5f5', borderRadius: '8px', fontWeight: '500' }}>
                                        🚫 Ver sesiones no facturables ({nonBillableSessions.length})
                                    </summary>
                                    <div className="my-sessions-list" style={{ marginTop: '10px', opacity: 0.7 }}>
                                        {nonBillableSessions.map((session) => (
                                            <div key={session.id} className="my-session-card non-billable" style={{ background: '#f9f9f9' }}>
                                                <div className="session-info">
                                                    <div className="session-datetime">
                                                        <strong>{session.dayOfWeek}</strong> {formatDate(session.date)}
                                                        <span className="session-time">{session.startTime} - {session.endTime}</span>
                                                    </div>
                                                    <div className="session-patient">{session.title}</div>
                                                </div>
                                                <div className="payment-options read-only">
                                                    <span className="status-badge non-billable">
                                                        {session.paymentStatus === 'cancelled' ? '❌ Anulada' : '🆓 Libre'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </>
                    );
                })()}
            </div>
        );
    };

    // === GLOBAL PAYMENT VIEW ===
    const renderGlobalPayments = () => {
        // First, calculate totals for ALL sessions (before status filter)
        // This ensures counters are consistent regardless of filter
        const allBillableSessions = globalSessions.filter(session => {
            if (session.isLibre) return false;
            // Apply therapist filter only (not status filter)
            if (filterTherapist !== 'all' && user.role === 'admin') {
                if (session.therapistName !== filterTherapist) return false;
            }
            return true;
        });

        // Calculate totals from ALL billable sessions (consistent counters)
        const summary = allBillableSessions.reduce((acc, s) => {
            if (s.paymentStatus === 'cancelled') return acc;
            acc.total += s.price;
            acc.totalSessions += 1;
            if (s.paymentStatus === 'pending' || s.paymentStatus === 'unpaid') {
                acc.pending += s.price;
                acc.pendingSessions += 1;
            } else {
                acc.paid += s.price;
                acc.paidSessions += 1;
                if (s.paymentStatus === 'cash') {
                    acc.cash += s.price;
                } else if (s.paymentStatus === 'transfer' || s.paymentStatus === 'bizum') {
                    acc.transfer += s.price;
                }
            }
            return acc;
        }, { total: 0, pending: 0, paid: 0, cash: 0, transfer: 0, totalSessions: 0, pendingSessions: 0, paidSessions: 0 });

        // Then apply status filter for display
        const visibleSessions = allBillableSessions.filter(session => {
            if (filterStatus === 'all') return true;
            const isPaid = session.paymentStatus === 'transfer' || session.paymentStatus === 'cash' || session.paymentStatus === 'bizum';
            const isPending = session.paymentStatus === 'pending' || session.paymentStatus === 'unpaid';
            if (filterStatus === 'paid' && !isPaid) return false;
            if (filterStatus === 'pending' && !isPending) return false;
            return true;
        });

        // Get unique therapist names for filter dropdown
        const therapistNames = [...new Set(globalSessions.map(s => s.therapistName))].sort();

        return (
            <div className="billing-detail global-payment-view">
                {/* Header with Invoice Button for Therapists */}
                {user.role !== 'admin' && (
                    <div className="billing-header" style={{ marginBottom: '20px' }}>
                        <h2>💰 Gestión de Pagos</h2>
                        <button className="btn-invoice" onClick={handleInvoiceClick} style={{ marginLeft: 'auto' }}>
                            📄 Generar Factura
                        </button>
                    </div>
                )}

                {/* Global Summary Dashboard - Admin ve euros, Terapeutas ven número de sesiones */}
                <div className="billing-summary-cards" style={{ marginBottom: '20px' }}>
                    <div
                        className="summary-card total clickable"
                        onClick={() => setFilterStatus('all')}
                        title="Ver todas las sesiones"
                    >
                        <span className="summary-value">
                            {user.role === 'admin' ? formatCurrency(summary.total) : summary.totalSessions}
                        </span>
                        <span className="summary-label">
                            {user.role === 'admin' ? 'Total Visible' : 'Sesiones Totales'}
                        </span>
                    </div>
                    <div
                        className="summary-card paid clickable"
                        onClick={() => setFilterStatus('paid')}
                        title="Ver solo pagados"
                    >
                        <span className="summary-value">
                            {user.role === 'admin' ? formatCurrency(summary.paid) : summary.paidSessions}
                        </span>
                        {user.role === 'admin' && (
                            <div className="payment-breakdown">
                                <span className="breakdown-item cash">💵 {formatCurrency(summary.cash)}</span>
                                <span className="breakdown-item transfer">🏦 {formatCurrency(summary.transfer)}</span>
                            </div>
                        )}
                        <span className="summary-label">
                            {user.role === 'admin' ? '✅ Pagado' : '✅ Sesiones Revisadas'}
                        </span>
                    </div>
                    <div
                        className="summary-card pending clickable"
                        onClick={() => setFilterStatus('pending')}
                        title="Ver solo pendientes"
                    >
                        <span className="summary-value">
                            {user.role === 'admin' ? formatCurrency(summary.pending) : summary.pendingSessions}
                        </span>
                        <span className="summary-label">
                            {user.role === 'admin' ? '⏳ Pendiente' : '⏳ Sesiones Pendientes'}
                        </span>
                    </div>
                </div>

                <div className="global-payment-filters">
                    <div className="date-range">
                        <label>Desde: <input type="date" value={globalStartDate} onChange={e => {
                            const newStart = e.target.value;
                            setGlobalStartDate(newStart);
                            // Auto-set end date to end of the month
                            if (newStart) {
                                const [y, m] = newStart.split('-');
                                const lastDay = new Date(y, m, 0).getDate(); // Day 0 of next month is last day of current
                                setGlobalEndDate(`${y}-${m}-${lastDay}`);
                            }
                        }} /></label>
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
                                onChange={(e) => {
                                    setFilterTherapist(e.target.value);
                                    // Fetch review summary when therapist is selected
                                    if (e.target.value !== 'all') {
                                        const therapist = globalSessions.find(s => s.therapistName === e.target.value);
                                        if (therapist) {
                                            fetchReviewSummary(therapist.therapistId);
                                        }
                                    } else {
                                        setReviewSummary(null);
                                        setSelectedTherapistId(null);
                                    }
                                }}
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

                {/* Admin Review Panel - shows when therapist selected + viewing paid */}
                {user.role === 'admin' && filterTherapist !== 'all' && filterStatus === 'paid' && (
                    (() => {
                        const derivedSummary = getDerivedReviewSummary();
                        if (!derivedSummary || (derivedSummary.cash.totalCount === 0 && derivedSummary.transfer.totalCount === 0)) return null;

                        return (
                            <div className="admin-review-panel">
                                <h4>📋 {filterTherapist} - Pendiente de Revisar</h4>

                                <div className="review-items">
                                    {/* Cash Review */}
                                    {derivedSummary.cash.totalCount > 0 && (
                                        <div className={`review-item-wrapper ${derivedSummary.cash.pendingCount === 0 ? 'fully-reviewed' : ''}`}>
                                            <div className="review-item cash">
                                                <span className="review-label">
                                                    💵 Efectivo: <strong>{formatCurrency(derivedSummary.cash.pendingAmount)}</strong> ({derivedSummary.cash.pendingCount} pend / {derivedSummary.cash.totalCount} total)
                                                    <button
                                                        className="btn-eye"
                                                        onClick={() => setShowReviewDetails(showReviewDetails === 'cash' ? null : 'cash')}
                                                        title="Ver/Gestionar sesiones"
                                                    >
                                                        {showReviewDetails === 'cash' ? '👁️' : '👁️‍🗨️'}
                                                    </button>
                                                </span>
                                                {/* Only show bulk review if there are pending items */}
                                                {derivedSummary.cash.pendingCount > 0 && (
                                                    <div className="review-action">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Cantidad..."
                                                            value={cashConfirmAmount}
                                                            onChange={(e) => setCashConfirmAmount(e.target.value)}
                                                            className="cash-confirm-input"
                                                        />
                                                        <button
                                                            className="btn-review-confirm"
                                                            onClick={confirmCashPayments}
                                                            disabled={!cashConfirmAmount}
                                                        >
                                                            ✓ Todo
                                                        </button>
                                                    </div>
                                                )}
                                                {derivedSummary.cash.pendingCount === 0 && <span className="reviewed-badge">✓ Al día</span>}
                                            </div>

                                            {showReviewDetails === 'cash' && (
                                                <div className="review-sessions-list">
                                                    {derivedSummary.cash.sessions
                                                        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Newest first
                                                        .map(s => {
                                                            const isReviewed = !!s.reviewedAt;
                                                            return (
                                                                <div key={s.id} className={`review-session-item ${isReviewed ? 'reviewed' : 'pending'}`}>
                                                                    <div className="session-check">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isReviewed}
                                                                            onChange={() => handleToggleReview(s, isReviewed)}
                                                                        />
                                                                    </div>
                                                                    <div className="session-details-mini">
                                                                        <span className="date">{formatDate(s.date)}</span>
                                                                        <span className="title">{s.title}</span>
                                                                        <span className="price">{formatCurrency(s.modifiedPrice || s.originalPrice || s.price)}</span>
                                                                    </div>
                                                                    {isReviewed && <span className="mini-badge">Revisado</span>}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Transfer Review */}
                                    {derivedSummary.transfer.totalCount > 0 && (
                                        <div className={`review-item-wrapper ${derivedSummary.transfer.pendingCount === 0 ? 'fully-reviewed' : ''}`}>
                                            <div className="review-item transfer">
                                                <span className="review-label">
                                                    🏦 Transferencia: <strong>{formatCurrency(derivedSummary.transfer.pendingAmount)}</strong> ({derivedSummary.transfer.pendingCount} pend / {derivedSummary.transfer.totalCount} total)
                                                    <button
                                                        className="btn-eye"
                                                        onClick={() => setShowReviewDetails(showReviewDetails === 'transfer' ? null : 'transfer')}
                                                        title="Ver/Gestionar sesiones"
                                                    >
                                                        {showReviewDetails === 'transfer' ? '👁️' : '👁️‍🗨️'}
                                                    </button>
                                                </span>
                                                {derivedSummary.transfer.pendingCount > 0 && (
                                                    <button
                                                        className="btn-review-confirm"
                                                        onClick={confirmTransferPayments}
                                                    >
                                                        ✓ Confirmar Todo
                                                    </button>
                                                )}
                                                {derivedSummary.transfer.pendingCount === 0 && <span className="reviewed-badge">✓ Al día</span>}
                                            </div>

                                            {showReviewDetails === 'transfer' && (
                                                <div className="review-sessions-list">
                                                    {derivedSummary.transfer.sessions
                                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                        .map(s => {
                                                            const isReviewed = !!s.reviewedAt;
                                                            return (
                                                                <div key={s.id} className={`review-session-item ${isReviewed ? 'reviewed' : 'pending'}`}>
                                                                    <div className="session-check">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isReviewed}
                                                                            onChange={() => handleToggleReview(s, isReviewed)}
                                                                        />
                                                                    </div>
                                                                    <div className="session-details-mini">
                                                                        <span className="date">{formatDate(s.date)}</span>
                                                                        <span className="title">{s.title}</span>
                                                                        <span className="price">{formatCurrency(s.modifiedPrice || s.originalPrice || s.price)}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()
                )}

                <div className="global-sessions-list">
                    {visibleSessions.length === 0 ? (
                        <p className="no-sessions">No hay sesiones en este periodo.</p>
                    ) : (
                        visibleSessions.map(session => {
                            // Check both local state and server-side modified price
                            const hasServerModifiedPrice = session.modifiedPrice !== null && session.modifiedPrice !== undefined;
                            const hasLocalModifiedPrice = sessionPrices[session.id] !== undefined;
                            const hasModifiedPrice = hasLocalModifiedPrice || hasServerModifiedPrice;

                            // Display price priority: local edit > server modified > server price
                            const displayPrice = sessionPrices[session.id] || session.price;
                            const originalPrice = session.originalPrice || 55;

                            return (
                                <div key={session.id} className={`pending-session-card ${session.paymentStatus} global-card ${recentlyRevokedId === session.id ? 'recently-revoked' : ''}`}>
                                    <div className="pending-session-info">
                                        <div className="session-date-row">
                                            <span className="session-date">{formatDate(session.date)}</span>
                                            <span className="session-therapist-tag" style={{ backgroundColor: session.therapistColor, color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', marginLeft: '8px' }}>
                                                {session.therapistName}
                                            </span>
                                        </div>
                                        <span className="session-title">{session.title}</span>

                                        {/* Price display/edit section */}
                                        {(session.paymentStatus === 'pending' || session.paymentStatus === 'unpaid') ? (
                                            <div className="session-price-edit">
                                                {editingPriceSessionId === session.id ? (
                                                    <div className="price-input-row">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={editingPriceValue}
                                                            onChange={(e) => setEditingPriceValue(e.target.value)}
                                                            className="price-input-mini"
                                                            autoFocus
                                                        />
                                                        <button
                                                            className="btn-confirm-price"
                                                            onClick={() => updateSessionPrice(session.id, editingPriceValue, false, session)}
                                                            disabled={!editingPriceValue}
                                                            title="Guardar precio"
                                                        >✅</button>
                                                        <button
                                                            className="btn-cancel-price"
                                                            onClick={() => { setEditingPriceSessionId(null); setEditingPriceValue(''); }}
                                                            title="Cancelar"
                                                        >✖️</button>
                                                    </div>
                                                ) : (
                                                    <div className="price-display-row">
                                                        <span
                                                            className={`session-price editable ${hasModifiedPrice ? 'modified' : ''}`}
                                                            onClick={() => {
                                                                setEditingPriceSessionId(session.id);
                                                                setEditingPriceValue(displayPrice.toString());
                                                            }}
                                                            title="Clic para editar precio"
                                                        >
                                                            {formatCurrency(displayPrice)}
                                                            {!hasModifiedPrice && <span className="edit-icon">✏️</span>}
                                                            {hasModifiedPrice && <span className="modified-indicator">(editado)</span>}
                                                        </span>
                                                        {hasModifiedPrice && (
                                                            <button
                                                                className="btn-reset-price"
                                                                onClick={() => updateSessionPrice(session.id, null, true, session)}
                                                                title="Restablecer precio original"
                                                            >↩️</button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* For paid sessions, show price (admin) with revoke option if modified */
                                            <div className="price-display-row">
                                                <span className={`session-price ${hasModifiedPrice ? 'modified' : ''}`}>
                                                    {formatCurrency(displayPrice)}
                                                    {hasModifiedPrice && <span className="modified-indicator">(editado)</span>}
                                                </span>
                                                {/* Revoke only for admin */}
                                                {user.role === 'admin' && hasModifiedPrice && (
                                                    <button
                                                        className="btn-revoke-price"
                                                        onClick={() => handleRevokeClick(session)}
                                                        title="Revocar cambio y devolver a pendiente"
                                                    >🔄 Revocar</button>
                                                )}
                                            </div>
                                        )}

                                        {session.paymentStatus !== 'pending' && (
                                            <>
                                                {/* Badge 1: Payment Type */}
                                                <span className={`status-badge ${session.paymentStatus} mini-badge badge-payment-type`}>
                                                    {session.paymentStatus === 'transfer' || session.paymentStatus === 'bizum' ? '🏦 Transferencia' :
                                                        session.paymentStatus === 'cash' ? '💵 Efectivo' :
                                                            session.paymentStatus === 'unpaid' ? '❌€ No Pagado' : '❌ Cancelada'}
                                                    {session.paymentDate && <span className="payment-date-small"> ({formatDate(session.paymentDate)})</span>}
                                                </span>

                                            </>
                                        )}
                                    </div>

                                    <div className="payment-actions">
                                        {/* Check if therapist can edit: 
                                            - Admin: always can edit
                                            - Therapist: can edit pending/unpaid/cancelled, or paid within 24h */}
                                        {(() => {
                                            const alwaysEditable = ['pending', 'cancelled', 'unpaid'].includes(session.paymentStatus);
                                            const isWithin24Hours = session.markedAt
                                                ? (Date.now() - new Date(session.markedAt).getTime()) < 24 * 60 * 60 * 1000
                                                : false;
                                            const canEdit = user.role === 'admin' || alwaysEditable || isWithin24Hours;

                                            if (!canEdit) {
                                                return null; // Don't show redundant text, badges handle it
                                            }

                                            if (transferDateSessionId === session.id) {
                                                return (
                                                    <div className="transfer-date-input">
                                                        <input
                                                            type="date"
                                                            value={transferDateValue}
                                                            onChange={(e) => setTransferDateValue(e.target.value)}
                                                            className="date-input-mini"
                                                            autoFocus
                                                        />
                                                        <button className="btn-confirm-transfer" onClick={() => markPayment(session.id, 'transfer', transferDateValue, session)} disabled={!transferDateValue}>✅</button>
                                                        <button className="btn-cancel-transfer" onClick={() => setTransferDateSessionId(null)}>✖️</button>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <>
                                                    <button
                                                        className={`btn-pay transfer ${session.paymentStatus === 'transfer' ? 'active' : ''}`}
                                                        onClick={() => handleTransferClick(session.id)}
                                                        title="Marcar como Transferencia"
                                                    >🏦</button>
                                                    <button
                                                        className={`btn-pay cash ${session.paymentStatus === 'cash' ? 'active' : ''}`}
                                                        onClick={() => markPayment(session.id, 'cash', null, session)}
                                                        title="Marcar como Efectivo"
                                                    >💵</button>
                                                    <button
                                                        className={`btn-pay unpaid ${session.paymentStatus === 'unpaid' ? 'active' : ''}`}
                                                        onClick={() => markPayment(session.id, 'unpaid', null, session)}
                                                        title="Marcar como no pagado (bloquea factura)"
                                                        disabled={!canEdit}
                                                    >❌€</button>
                                                    <button
                                                        className={`btn-pay cancel ${session.paymentStatus === 'cancelled' ? 'active' : ''}`}
                                                        onClick={() => markPayment(session.id, 'cancelled', null, session)}
                                                        title="Cancelar (No contabilizar)"
                                                    >❌</button>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Badge 2: Review Status (Only for paid forms) - MOVED TO END */}
                                    {['cash', 'transfer', 'bizum'].includes(session.paymentStatus) && (
                                        <span className={`status-badge mini-badge badge-review-status ${session.reviewedAt ? 'processed' : 'review-pending'}`} style={{ marginLeft: 'auto' }}>
                                            {session.reviewedAt
                                                ? <span title="Revisado por admin">✅ Procesado</span>
                                                : <span title="Pendiente de revisar">⏳ En revisión</span>
                                            }
                                        </span>
                                    )}
                                </div>
                            )
                        })
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

    // === INVOICE GENERATOR VIEW ===
    const renderInvoiceGenerator = () => {
        // Calculate totals
        const subtotal = invoiceSessions.reduce((sum, s) => sum + (s.price || 0), 0);
        const centerPercentage = 100 - therapistPercentage;
        const centerAmount = subtotal * (centerPercentage / 100);
        const baseDisponible = subtotal * (therapistPercentage / 100);
        const ivaAmount = baseDisponible * (iva / 100);
        const irpfAmount = baseDisponible * (irpf / 100);
        const totalFactura = baseDisponible + ivaAmount - irpfAmount;

        // Filter active sessions for display
        const activeInvoiceSessions = invoiceSessions.filter(s => !excludedSessions.has(s.id));

        // Recalculate totals based on active sessions
        const activeSubtotal = activeInvoiceSessions.reduce((sum, s) => sum + (s.price || 0), 0);
        const activeCenterAmount = activeSubtotal * (centerPercentage / 100);
        const activeBaseDisponible = activeSubtotal * (therapistPercentage / 100);
        const activeIvaAmount = activeBaseDisponible * (iva / 100);
        const activeIrpfAmount = activeBaseDisponible * (irpf / 100);
        const activeTotalFactura = activeBaseDisponible + activeIvaAmount - activeIrpfAmount;

        // Count excluded
        const excludedCount = excludedSessions.size;

        return (
            <div className="billing-detail invoice-view">
                <div className="billing-header">
                    <button className="btn-back-billing" onClick={() => setBillingMode('calendar')}>← Volver</button>
                    <h2>📄 Generar Factura</h2>
                </div>

                {/* Month/Year Selector */}
                <div className="invoice-month-selector">
                    <label>
                        Mes:
                        <select value={invoiceMonth} onChange={(e) => setInvoiceMonth(parseInt(e.target.value))}>
                            {months.map((month, index) => (
                                <option key={index} value={index}>{month}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Año:
                        <select value={invoiceYear} onChange={(e) => setInvoiceYear(parseInt(e.target.value))}>
                            {[2024, 2025, 2026].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Pending Sessions Warning */}
                {invoiceHasPending ? (
                    <div className="invoice-pending-warning">
                        <p>⚠️ {invoicePendingMessage}</p>
                        <button
                            className="btn-go-to-payments"
                            onClick={() => {
                                setBillingMode('payments');
                                const year = invoiceYear;
                                const month = invoiceMonth;
                                const startDate = new Date(year, month, 1);
                                const endDate = new Date(year, month + 1, 0);
                                setGlobalStartDate(startDate.toLocaleDateString('en-CA'));
                                setGlobalEndDate(endDate.toLocaleDateString('en-CA'));
                                setFilterStatus('pending');
                            }}
                        >
                            Ir a Gestión de Pagos
                        </button>
                    </div>
                ) : invoiceSessions.length === 0 ? (
                    <div className="no-sessions">
                        <p>No hay sesiones facturables en este mes.</p>
                    </div>
                ) : (
                    <>
                        {/* Configuration Inputs */}
                        <div className="invoice-inputs">
                            <label>
                                Nº Factura:
                                <input
                                    type="text"
                                    placeholder="Ej: 2026-001"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                />
                            </label>
                            <label>
                                % Terapeuta:
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={therapistPercentage}
                                    onChange={(e) => setTherapistPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                />
                            </label>
                            <label>
                                IRPF:
                                <select value={irpf} onChange={(e) => setIrpf(parseInt(e.target.value))}>
                                    <option value={0}>0%</option>
                                    <option value={7}>7%</option>
                                    <option value={15}>15%</option>
                                </select>
                            </label>
                            <label>
                                IVA:
                                <select value={iva} onChange={(e) => setIva(parseInt(e.target.value))}>
                                    <option value={0}>0%</option>
                                    <option value={21}>21%</option>
                                </select>
                            </label>
                        </div>

                        {/* Sessions Table */}
                        <div className="invoice-sessions-table">
                            <div className="table-header-with-hint">
                                <h3>Sesiones del Mes</h3>
                                <span className="scroll-hint">← Desliza para ver más →</span>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Hora</th>
                                        <th>Paciente</th>
                                        <th>Precio</th>
                                        <th style={{ width: '50px' }}>Exc.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceSessions.map((session, index) => {
                                        const isExcluded = excludedSessions.has(session.id);
                                        return (
                                            <tr key={session.id || index} className={isExcluded ? 'session-excluded' : ''}>
                                                <td>{formatDate(session.date)}</td>
                                                <td>{session.startTime}</td>
                                                <td>{session.title}</td>
                                                <td>{formatCurrency(session.price)}</td>
                                                <td className="text-center">
                                                    {!invoiceSubmitted && (
                                                        <button
                                                            className={`btn-exclude-session ${isExcluded ? 'active' : ''}`}
                                                            onClick={() => toggleSessionExclusion(session.id)}
                                                            title={isExcluded ? "Incluir de nuevo" : "Excluir de factura"}
                                                        >
                                                            {isExcluded ? '↩️' : '❌'}
                                                        </button>
                                                    )}
                                                    {invoiceSubmitted && isExcluded && '❌'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {excludedCount > 0 && (
                                <div className="excluded-summary-note">
                                    <small>ℹ️ Se han excluido {excludedCount} sesión(es) de los cálculos.</small>
                                </div>
                            )}
                        </div>

                        {/* Invoice Summary */}
                        <div className="invoice-summary">
                            <div className="summary-row">
                                <span>SUBTOTAL:</span>
                                <span>{formatCurrency(activeSubtotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>PORCENTAJE CENTRO ({centerPercentage}%):</span>
                                <span>{formatCurrency(activeCenterAmount)}</span>
                            </div>
                            <div className="summary-row">
                                <span>BASE DISPONIBLE ({therapistPercentage}%):</span>
                                <span>{formatCurrency(activeBaseDisponible)}</span>
                            </div>
                            <div className="summary-row">
                                <span>+ {iva}% IVA:</span>
                                <span>{formatCurrency(activeIvaAmount)}</span>
                            </div>
                            <div className="summary-row">
                                <span>- {irpf}% IRPF:</span>
                                <span>{formatCurrency(activeIrpfAmount)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>TOTAL FACTURA:</span>
                                <span>{formatCurrency(activeTotalFactura)}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {/* Action Buttons */}
                        <div className="invoice-actions">
                            <button className="btn-download-pdf" onClick={downloadInvoicePDF}>
                                Descargar PDF
                            </button>

                            {invoiceSubmitted ? (
                                <button className="btn-submit-invoice submitted" disabled>
                                    ✅ Factura Presentada
                                </button>
                            ) : (
                                <button className="btn-submit-invoice" onClick={submitInvoice}>
                                    Presentar Factura
                                </button>
                            )}
                        </div>
                    </>
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
            ) : billingMode === 'invoice' ? (
                renderInvoiceGenerator()
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
                    {view === 'pending' && renderPendingView()}
                </>
            )}

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content mobile-popup">
                        <h3>📤 Presentar Factura</h3>
                        <p>¿Estás seguro de que deseas presentar esta factura?</p>
                        <p className="modal-warning">Una vez presentada, quedará registrada en el sistema y no podrás modificarla.</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
                            <button className="btn-confirm" onClick={confirmSubmission}>Confirmar y Presentar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Price Modal */}
            <ConfirmModal
                isOpen={showRevokeModal}
                onClose={() => { setShowRevokeModal(false); setSessionToRevoke(null); }}
                onConfirm={confirmRevokePriceChange}
                title="🔄 Revocar Cambio de Precio"
                message={sessionToRevoke ?
                    `La sesión volverá a pendiente con el precio original (${formatCurrency(sessionToRevoke.originalPrice || 55)}) y el terapeuta recibirá una notificación.`
                    : ''}
                confirmText="Revocar"
                cancelText="Cancelar"
                isDanger={true}
            />
            {/* Review Toggle Confirmation Modal */}
            <ConfirmModal
                isOpen={reviewConfirm.isOpen}
                onClose={() => setReviewConfirm({ ...reviewConfirm, isOpen: false })}
                onConfirm={() => {
                    executeToggleReview(reviewConfirm.session, reviewConfirm.isReviewed);
                    setReviewConfirm({ ...reviewConfirm, isOpen: false });
                }}
                title="Desmarcar Revisión"
                message={`¿Estás seguro de que quieres marcar esta sesión como NO revisada?\n\n${reviewConfirm.session ? `${formatDate(reviewConfirm.session.date)} - ${reviewConfirm.session.title}` : ''}`}
                confirmText="Sí, desmarcar"
                cancelText="Cancelar"
                isDanger={true}
            />
            {/* Error Message Modal */}
            <ConfirmModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
                title={errorModal.title}
                message={errorModal.message}
                confirmText="Entendido"
                cancelText="Cerrar"
                isDanger={true}
            />
        </div>
    );
};

export default BillingTab;
