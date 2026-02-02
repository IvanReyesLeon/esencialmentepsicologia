const {
    getSessions,
    getWeeklySummary,
    getWeeksOfMonth,
    getRawEvents,
    detectTherapist,
    getTherapistMap,
    isNonBillable
} = require('../services/calendarService');
const { Resend } = require('resend');
const { getAllTherapists } = require('../models/therapistQueries');
const pool = require('../config/db');

// Calendar ID - could be moved to env
const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

/**
 * Get weeks of a month
 */
exports.getWeeks = async (req, res) => {
    try {
        const { year, month } = req.query;
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) ?? new Date().getMonth();

        const weeks = getWeeksOfMonth(y, m);

        res.json({
            year: y,
            month: m,
            weeks
        });
    } catch (error) {
        console.error('Error getting weeks:', error);
        res.status(500).json({ message: 'Error getting weeks' });
    }
};

/**
 * Get weekly billing summary for admin (all therapists)
 */
exports.getWeeklySummaryAdmin = async (req, res) => {
    try {
        const { year, month, week } = req.query;

        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) ?? new Date().getMonth();
        const w = parseInt(week) || 1;

        const weeks = getWeeksOfMonth(y, m);
        const selectedWeek = weeks[w - 1];

        if (!selectedWeek) {
            return res.status(400).json({ message: 'Invalid week number' });
        }

        const therapists = await getAllTherapists();
        const summary = await getWeeklySummary(
            CALENDAR_ID,
            selectedWeek.start,
            selectedWeek.end,
            therapists
        );

        // Get payment status from database for these sessions
        const sessionIds = summary.byTherapist.flatMap(t => t.sessions.map(s => s.id));

        let payments = [];
        if (sessionIds.length > 0) {
            const paymentResult = await pool.query(
                `SELECT event_id, payment_type, marked_at, therapist_id 
                 FROM session_payments 
                 WHERE event_id = ANY($1)`,
                [sessionIds]
            );
            payments = paymentResult.rows;
        }

        // Merge payment data with sessions
        const paymentMap = {};
        payments.forEach(p => {
            paymentMap[p.event_id] = p;
        });

        summary.byTherapist.forEach(therapist => {
            let paidAmount = 0;
            let pendingAmount = 0;
            let paidCount = 0;
            let pendingCount = 0;

            therapist.sessions.forEach(session => {
                const payment = paymentMap[session.id];
                session.paymentStatus = payment ? payment.payment_type : 'pending';
                session.markedAt = payment?.marked_at || null;

                if (payment && ['cash', 'transfer', 'bizum'].includes(payment.payment_type)) {
                    paidAmount += session.price;
                    paidCount++;
                } else if (!payment || payment.payment_type === 'pending' || payment.payment_type === 'unpaid') {
                    if (payment && payment.payment_type === 'cancelled') {
                        // Do nothing for cancelled
                    } else {
                        pendingAmount += session.price;
                        pendingCount++;
                    }
                }
                // Cancelled sessions are neither paid nor pending for totals
            });

            therapist.paidAmount = paidAmount;
            therapist.pendingAmount = pendingAmount;
            therapist.paidCount = paidCount;
            therapist.pendingCount = pendingCount;
        });

        // Calculate totals
        summary.summary.paidAmount = summary.byTherapist.reduce((sum, t) => sum + t.paidAmount, 0);
        summary.summary.pendingAmount = summary.byTherapist.reduce((sum, t) => sum + t.pendingAmount, 0);
        summary.summary.paidSessions = summary.byTherapist.reduce((sum, t) => sum + t.paidCount, 0);
        summary.summary.pendingSessions = summary.byTherapist.reduce((sum, t) => sum + t.pendingCount, 0);

        res.json({
            week: {
                number: w,
                ...selectedWeek
            },
            ...summary
        });

    } catch (error) {
        console.error('Weekly summary error:', error);
        res.status(500).json({ message: 'Error getting weekly summary' });
    }
};

/**
 * Get sessions for a therapist (their own sessions only)
 */
exports.getTherapistSessions = async (req, res) => {
    try {
        const { therapist_id } = req.user;
        const { year, month, week } = req.query;

        if (!therapist_id) {
            return res.status(400).json({ message: 'User is not linked to a therapist profile' });
        }

        // Get therapist info
        const therapists = await getAllTherapists();
        const me = therapists.find(t => t.id === therapist_id);

        if (!me) {
            return res.status(400).json({ message: 'Therapist profile not found' });
        }

        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) ?? new Date().getMonth();
        const w = parseInt(week) || 1;

        const weeks = getWeeksOfMonth(y, m);
        const selectedWeek = weeks[w - 1];

        if (!selectedWeek) {
            return res.status(400).json({ message: 'Invalid week number' });
        }

        // Get ALL sessions first (no colorId filter)
        const allSessions = await getSessions(
            CALENDAR_ID,
            selectedWeek.start,
            selectedWeek.end,
            null // No filter - we'll filter by therapistId below
        );

        // Filter sessions by therapistId (from /nombre/ detection)
        const sessions = allSessions.filter(s => s.therapistId === therapist_id);

        // Get payment status
        const sessionIds = sessions.map(s => s.id);
        let payments = [];
        if (sessionIds.length > 0) {
            const paymentResult = await pool.query(
                `SELECT event_id, payment_type, marked_at, reviewed_at 
                 FROM session_payments 
                 WHERE event_id = ANY($1) AND therapist_id = $2`,
                [sessionIds, therapist_id]
            );
            payments = paymentResult.rows;
        }

        const paymentMap = {};
        payments.forEach(p => {
            paymentMap[p.event_id] = p;
        });

        let paidAmount = 0;
        let pendingAmount = 0;
        let paidSessions = 0;
        let pendingSessions = 0;
        let billableSessions = 0;

        sessions.forEach(session => {
            const payment = paymentMap[session.id];
            session.paymentStatus = payment ? payment.payment_type : 'pending';
            session.markedAt = payment?.marked_at || null;
            session.reviewedAt = payment?.reviewed_at || null;

            // Solo contar sesiones facturables (precio > 0 y no canceladas)
            if (session.price > 0 && session.paymentStatus !== 'cancelled') {
                billableSessions++;
                if (payment && ['cash', 'transfer', 'bizum'].includes(payment.payment_type)) {
                    paidAmount += session.price;
                    paidSessions++;
                } else {
                    // Pending or Unpaid
                    pendingAmount += session.price;
                    pendingSessions++;
                }
            }
        });

        res.json({
            therapist: me.full_name,
            week: {
                number: w,
                ...selectedWeek
            },
            sessions,
            summary: {
                totalSessions: billableSessions, // Solo facturables
                paidSessions,
                pendingSessions,
                totalAmount: sessions.filter(s => s.price > 0).reduce((sum, s) => sum + s.price, 0),
                paidAmount,
                pendingAmount
            }
        });

    } catch (error) {
        console.error('Therapist sessions error:', error);
        res.status(500).json({ message: 'Error getting sessions' });
    }
};

/**
 * Get global sessions for payment management (flat list, date range)
 */
exports.getGlobalSessions = async (req, res) => {
    try {
        const { therapist_id, role } = req.user;
        const { targetTherapistId, startDate, endDate } = req.query;

        let queryTherapistId = therapist_id;
        if (role === 'admin' && targetTherapistId) {
            queryTherapistId = targetTherapistId; // Admin viewing specific therapist
        } else if (role === 'admin' && !targetTherapistId) {
            queryTherapistId = null; // Admin viewing ALL (processed below)
        }

        // Parse dates
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31);

        // Calculate ISO strings for Google Calendar
        const timeMin = start.toISOString();
        const timeMax = end.toISOString();

        // 1. Fetch from Google Calendar (using service)
        const events = await getRawEvents(start, end);

        // 2. Fetch payments from DB
        // 2. Fetch payments from DB
        const paymentsRes = await pool.query(`SELECT * FROM session_payments`);
        const paymentsMap = {};
        paymentsRes.rows.forEach(p => {
            paymentsMap[p.event_id] = p;
        });

        const therapistMap = await getTherapistMap();

        // 3. Process events
        const processedSessions = events
            .map(event => {
                // Detect therapist using dynamic map
                const detected = detectTherapist(event.summary || '', therapistMap);
                if (!detected && !process.env.IncludeUnknown) return null; // Skip if strict

                // Filter out "Anna"
                if ((event.summary || '').toLowerCase().includes('anna')) return null;

                const sessionTherapistId = detected ? detected.id : 'unknown';
                const sessionTherapistName = detected ? detected.name : 'Desconocido';
                const sessionColor = detected ? detected.color : event.colorId;

                // Create session object
                const session = {
                    id: event.id,
                    title: event.summary,
                    start: event.start.dateTime || event.start.date,
                    end: event.end.dateTime || event.end.date,
                    date: (event.start.dateTime || event.start.date).split('T')[0],
                    therapistId: sessionTherapistId,
                    therapistName: sessionTherapistName,
                    therapistColor: sessionColor,
                    description: event.description
                };

                // Filter by Requested Therapist
                if (queryTherapistId && String(session.therapistId) !== String(queryTherapistId)) {
                    return null;
                }

                // Skip 'Unknown' if we only want assigned
                if (sessionTherapistId === 'unknown') return null;

                // Strict date filtering
                const sDate = new Date(event.start.dateTime || event.start.date);
                const eDate = new Date(end);
                eDate.setHours(23, 59, 59, 999);
                const stDate = new Date(start);
                stDate.setHours(0, 0, 0, 0);

                if (sDate < stDate || sDate > eDate) {
                    return null; // Out of range
                }

                // Check non-billable (libre, anulada, no disponible)
                const titleLower = (session.title || '').toLowerCase();
                if (titleLower.includes('libre') || titleLower.includes('anulada') || titleLower.includes('no disponible')) {
                    session.isLibre = true;
                    session.price = 0;
                } else {
                    session.isLibre = false;
                    session.price = 55; // Default price
                }

                // Attach Payment Info
                if (paymentsMap[session.id]) {
                    const payment = paymentsMap[session.id];
                    session.paymentStatus = payment.payment_type;
                    session.paidAt = payment.marked_at;
                    session.markedAt = payment.marked_at; // For 24h window calculation
                    session.paymentDate = payment.payment_date;
                    session.reviewedAt = payment.reviewed_at || null; // Admin review status
                    // Include price modification info
                    session.originalPrice = payment.original_price || session.price;
                    session.modifiedPrice = payment.modified_price || null;
                    // Use modified price if available
                    if (payment.modified_price !== null && payment.modified_price !== undefined) {
                        session.price = parseFloat(payment.modified_price);
                    } else if (payment.original_price !== null && payment.original_price !== undefined) {
                        session.price = parseFloat(payment.original_price);
                    }
                } else {
                    session.paymentStatus = 'pending';
                    session.originalPrice = session.price;
                    session.modifiedPrice = null;
                    session.reviewedAt = null;
                }

                return session;
            })
            .filter(Boolean) // Remove nulls
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

        res.json({ sessions: processedSessions });

    } catch (error) {
        console.error('Error fetching global sessions:', error);
        res.status(500).json({ message: 'Error fetching sessions' });
    }
};

exports.markSessionPaid = async (req, res) => {
    try {
        const { therapist_id, role } = req.user;
        const { eventId } = req.params;
        const {
            paymentType,
            paymentDate,
            // New fields for session history
            sessionDate,
            sessionTitle,
            originalPrice,
            modifiedPrice,
            targetTherapistId // Admin can specify the therapist
        } = req.body; // 'transfer' | 'cash' | 'cancelled' | 'unpaid' | null

        if (!eventId) {
            return res.status(400).json({ message: 'Event ID required' });
        }

        // Get existing payment status for audit log AND therapist_id
        const existingPaymentResult = await pool.query(
            `SELECT payment_type, original_price, modified_price, marked_at, therapist_id FROM session_payments WHERE event_id = $1`,
            [eventId]
        );
        const existingRecord = existingPaymentResult.rows[0];
        const oldStatus = existingRecord?.payment_type || 'pending';

        // Determine therapist ID: from request, from user, or from existing record
        let effectiveTherapistId = targetTherapistId || therapist_id || existingRecord?.therapist_id;

        // For non-admin users, require therapist_id
        if (!effectiveTherapistId && role !== 'admin') {
            return res.status(400).json({ message: 'User is not linked to a therapist profile' });
        }

        // For admin creating new record without therapist info, require targetTherapistId
        // But if modifying existing record, use its therapist_id
        if (!effectiveTherapistId && role === 'admin') {
            if (!existingRecord) {
                return res.status(400).json({ message: 'Debes especificar el terapeuta para crear un nuevo registro de pago.' });
            }
            // If here, we have existingRecord but its therapist_id is null - use first one from session_payments as fallback
            effectiveTherapistId = existingRecord.therapist_id || 1; // Fallback to 1 if somehow null
        }

        // Check permissions: Therapists have limited edit rights
        if (req.user.role !== 'admin') {
            // Therapists can always edit: pending, cancelled, unpaid
            const alwaysEditableStatuses = ['pending', 'cancelled', 'unpaid'];

            if (!alwaysEditableStatuses.includes(oldStatus)) {
                // For paid statuses (transfer, cash), check 24h window
                const markedAt = existingRecord?.marked_at;
                if (markedAt) {
                    const hoursElapsed = (Date.now() - new Date(markedAt).getTime()) / (1000 * 60 * 60);
                    if (hoursElapsed > 24) {
                        return res.status(403).json({
                            message: 'Han pasado más de 24 horas desde que marcaste esta sesión. Contacta con el administrador para cambiarla.'
                        });
                    }
                } else {
                    // No marked_at means it was never marked as paid, should be pending
                    return res.status(403).json({ message: 'No tienes permiso para modificar esta sesión.' });
                }
            }
        }

        if (paymentType === null || paymentType === 'pending') {
            // Remove payment record
            await pool.query(
                `DELETE FROM session_payments WHERE event_id = $1`,
                [eventId]
            );
        } else {
            // Upsert payment record with session history data
            await pool.query(
                `INSERT INTO session_payments (
                    event_id, therapist_id, payment_type, marked_at, payment_date,
                    session_date, session_title, original_price, modified_price
                )
                 VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8)
                 ON CONFLICT (event_id) 
                 DO UPDATE SET 
                    payment_type = $3, 
                    marked_at = NOW(), 
                    payment_date = $4,
                    session_date = COALESCE($5, session_payments.session_date),
                    session_title = COALESCE($6, session_payments.session_title),
                    original_price = COALESCE($7, session_payments.original_price),
                    modified_price = COALESCE($8, session_payments.modified_price)`,
                [
                    eventId,
                    effectiveTherapistId,
                    paymentType,
                    paymentDate || null,
                    sessionDate || null,
                    sessionTitle || null,
                    originalPrice || 55.00,
                    modifiedPrice || null
                ]
            );
        }

        // Log the change in audit table
        const action = paymentType === 'pending' || paymentType === null ? 'reverted' :
            oldStatus === 'pending' ? 'marked_paid' : 'changed';

        await pool.query(`
            INSERT INTO payment_audit_log 
            (event_id, user_id, action, old_status, new_status, payment_date)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            eventId,
            req.user.id,
            action,
            oldStatus,
            paymentType || 'pending',
            paymentDate || null
        ]);

        res.json({ success: true, eventId, paymentType });

    } catch (error) {
        console.error('Mark paid error:', error);
        res.status(500).json({ message: 'Error marking session' });
    }
};

/**
 * Update session price (before marking payment status)
 * - Therapist can modify price of their own sessions
 * - Admin can reset price of any session
 * - Both actions create notifications
 */
exports.updateSessionPrice = async (req, res) => {
    try {
        const { therapist_id, role, id: userId } = req.user;
        const { eventId } = req.params;
        const {
            modifiedPrice,
            resetToOriginal,
            sessionDate,
            sessionTitle,
            originalPrice,
            targetTherapistId // For admin to specify which therapist's session
        } = req.body;

        if (!eventId) {
            return res.status(400).json({ message: 'Event ID required' });
        }

        // Determine the therapist ID to use
        const effectiveTherapistId = role === 'admin' && targetTherapistId
            ? targetTherapistId
            : therapist_id;

        if (!effectiveTherapistId) {
            return res.status(400).json({ message: 'Therapist ID required' });
        }

        // Get existing record
        const existingResult = await pool.query(
            `SELECT * FROM session_payments WHERE event_id = $1`,
            [eventId]
        );
        const existingRecord = existingResult.rows[0];

        // Check if session already has a payment status (not pending/unpaid)
        // Allow price edit for pending and unpaid (unpaid might be due to wrong price)
        const editableStatuses = ['pending', 'unpaid', null, undefined];
        if (existingRecord && !editableStatuses.includes(existingRecord.payment_type)) {
            return res.status(403).json({
                message: 'No se puede modificar el precio de una sesión que ya tiene estado de pago asignado.'
            });
        }

        const oldPrice = existingRecord?.modified_price || existingRecord?.original_price || 55.00;
        const newPrice = resetToOriginal ? null : modifiedPrice;
        const effectiveOriginalPrice = originalPrice || existingRecord?.original_price || 55.00;

        // Upsert the session payment record with the new price
        await pool.query(
            `INSERT INTO session_payments (
                event_id, therapist_id, payment_type, 
                session_date, session_title, original_price, modified_price
            )
             VALUES ($1, $2, 'pending', $3, $4, $5, $6)
             ON CONFLICT (event_id) 
             DO UPDATE SET 
                modified_price = $6,
                session_date = COALESCE($3, session_payments.session_date),
                session_title = COALESCE($4, session_payments.session_title),
                original_price = COALESCE($5, session_payments.original_price),
                updated_at = NOW()`,
            [
                eventId,
                effectiveTherapistId,
                sessionDate || null,
                sessionTitle || null,
                effectiveOriginalPrice,
                newPrice
            ]
        );

        // Get therapist name for notification
        const therapistResult = await pool.query(
            `SELECT full_name FROM therapists WHERE id = $1`,
            [effectiveTherapistId]
        );
        const therapistName = therapistResult.rows[0]?.full_name || 'Terapeuta';

        // Format date for notification
        const formattedDate = sessionDate
            ? new Date(sessionDate).toLocaleDateString('es-ES')
            : 'fecha desconocida';

        // Create notifications based on who made the change
        if (role === 'admin') {
            // Admin changed price → Notify the therapist
            const userResult = await pool.query(
                `SELECT id FROM users WHERE therapist_id = $1`,
                [effectiveTherapistId]
            );
            const targetUserId = userResult.rows[0]?.id;

            if (targetUserId) {
                const message = resetToOriginal
                    ? `El administrador ha restablecido el precio de tu sesión del ${formattedDate} al precio original (${effectiveOriginalPrice}€).`
                    : `El administrador ha modificado el precio de tu sesión del ${formattedDate} de ${oldPrice}€ a ${modifiedPrice}€.`;

                await pool.query(
                    `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'info')`,
                    [targetUserId, message]
                );
            }
        } else {
            // Therapist changed price → Notify all admins
            const adminResult = await pool.query(
                `SELECT u.id FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE r.name = 'admin'`
            );

            const message = resetToOriginal
                ? `${therapistName} ha restablecido el precio de su sesión del ${formattedDate} al precio original (${effectiveOriginalPrice}€).`
                : `${therapistName} ha modificado el precio de su sesión del ${formattedDate} de ${effectiveOriginalPrice}€ a ${modifiedPrice}€.`;

            for (const admin of adminResult.rows) {
                await pool.query(
                    `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'warning')`,
                    [admin.id, message]
                );
            }
        }

        res.json({
            success: true,
            eventId,
            originalPrice: effectiveOriginalPrice,
            modifiedPrice: newPrice,
            resetToOriginal: !!resetToOriginal
        });

    } catch (error) {
        console.error('Update session price error:', error);
        res.status(500).json({ message: 'Error updating session price' });
    }
};

/**
 * Admin: Revoke price change and reset session to pending
 * This resets modified_price to null and payment status to pending
 */
exports.revokePriceChange = async (req, res) => {
    try {
        const { role } = req.user;
        const { eventId } = req.params;
        const { sessionDate, sessionTitle, originalPrice, targetTherapistId } = req.body;

        // Only admin can revoke
        if (role !== 'admin') {
            return res.status(403).json({ message: 'Solo el administrador puede revocar cambios de precio.' });
        }

        if (!eventId) {
            return res.status(400).json({ message: 'Event ID required' });
        }

        // Check if session exists and has modified price
        const existingResult = await pool.query(
            `SELECT * FROM session_payments WHERE event_id = $1`,
            [eventId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró la sesión en el registro de pagos.' });
        }

        const existingPayment = existingResult.rows[0];
        const oldModifiedPrice = existingPayment.modified_price;
        const therapistId = existingPayment.therapist_id || targetTherapistId;

        // Reset: set modified_price to null, restore original_price (fix inconsistencies) and payment_type to pending
        await pool.query(
            `UPDATE session_payments 
             SET modified_price = NULL, 
                 original_price = $2,
                 payment_type = 'pending',
                 payment_date = NULL,
                 marked_at = NOW()
             WHERE event_id = $1`,
            [eventId, originalPrice || 55] // Default to 55 if missing
        );

        // Notify the therapist
        if (therapistId) {
            // Get user linked to this therapist
            const userResult = await pool.query(
                `SELECT id FROM users WHERE therapist_id = $1`,
                [therapistId]
            );

            // Format date for notification
            const formattedDate = sessionDate
                ? new Date(sessionDate).toLocaleDateString('es-ES')
                : 'fecha desconocida';

            const message = `El administrador ha revocado el cambio de precio de tu sesión del ${formattedDate}. La sesión ha vuelto a pendiente con el precio original (${originalPrice || 55}€). Por favor, revísala.`;

            for (const user of userResult.rows) {
                await pool.query(
                    `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'warning')`,
                    [user.id, message]
                );
            }
        }

        // Log the action (simplified to avoid column issues)
        try {
            await pool.query(`
                INSERT INTO payment_audit_log 
                (event_id, user_id, action, old_status, new_status)
                VALUES ($1, $2, 'price_revoked', $3, 'pending')
            `, [
                eventId,
                req.user.id,
                existingPayment.payment_type || 'unknown'
            ]);
        } catch (logError) {
            console.error('Audit log failed (non-blocking):', logError.message);
        }

        res.json({
            success: true,
            eventId,
            message: 'Cambio de precio revocado. La sesión ha vuelto a pendiente.'
        });

    } catch (error) {
        console.error('Revoke price change error:', error);
        res.status(500).json({ message: 'Error al revocar cambio de precio' });
    }
};

/**
 * Get monthly sessions for a therapist (for invoice generation)
 */
exports.getMonthlyTherapistSessions = async (req, res) => {
    try {
        const { therapist_id } = req.user;
        const { year, month } = req.query;

        if (!therapist_id) {
            return res.status(400).json({ message: 'User is not linked to a therapist profile' });
        }

        // Get therapist info
        const therapists = await getAllTherapists();
        const me = therapists.find(t => t.id === therapist_id);

        if (!me) {
            return res.status(400).json({ message: 'Therapist profile not found' });
        }

        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) ?? new Date().getMonth();

        // Calculate month range
        const startDate = new Date(y, m, 1);
        const endDate = new Date(y, m + 1, 0, 23, 59, 59); // Last day of month

        // Get ALL sessions for the month (no colorId filter)
        const allSessions = await getSessions(
            CALENDAR_ID,
            startDate,
            endDate,
            null // No filter - we'll filter by therapistId below
        );

        // Filter sessions by therapistId
        const sessions = allSessions.filter(s => s.therapistId === therapist_id);

        // Get payment status
        const sessionIds = sessions.map(s => s.id);
        let payments = [];
        if (sessionIds.length > 0) {
            const paymentResult = await pool.query(
                `SELECT event_id, payment_type, marked_at, original_price, modified_price 
                 FROM session_payments 
                 WHERE event_id = ANY($1) AND therapist_id = $2`,
                [sessionIds, therapist_id]
            );
            payments = paymentResult.rows;
        }

        const paymentMap = {};
        payments.forEach(p => {
            paymentMap[p.event_id] = p;
        });

        let totalAmount = 0;
        let pendingCount = 0;
        const billableSessions = [];

        sessions.forEach(session => {
            const payment = paymentMap[session.id];

            if (payment) {
                // If payment record exists, source of truth is DB
                // Start with recorded original price
                if (payment.original_price) {
                    session.price = parseFloat(payment.original_price);
                }

                // Override if modified price exists
                if (payment.modified_price) {
                    session.price = parseFloat(payment.modified_price);
                }

                session.paymentStatus = payment.payment_type;
                session.markedAt = payment.marked_at || null;
            } else {
                session.paymentStatus = 'pending';
                session.markedAt = null;
            }

            // Only count billable sessions (price > 0 and not cancelled/free)
            if (session.price > 0 && session.paymentStatus !== 'cancelled' && !session.isLibre) {
                billableSessions.push(session);
                totalAmount += session.price;

                // Check if pending or unpaid (both block invoice)
                if (session.paymentStatus === 'pending' || session.paymentStatus === 'unpaid') {
                    pendingCount++;
                }
            }
        });

        // If there are pending/unpaid sessions, return error
        if (pendingCount > 0) {
            return res.status(400).json({
                error: true,
                hasPending: true,
                pendingCount,
                message: `Tienes ${pendingCount} sesión${pendingCount > 1 ? 'es' : ''} sin confirmar pago en este mes. Por favor, márcalas como pagadas (transferencia o efectivo) antes de generar la factura.`
            });
        }

        // Return sessions for invoice
        res.json({
            therapist: me.full_name,
            year: y,
            month: m,
            sessions: billableSessions,
            hasPending: pendingCount > 0,
            summary: {
                totalSessions: billableSessions.length,
                subtotal: totalAmount
            }
        });

    } catch (error) {
        console.error('Monthly therapist sessions error:', error);
        res.status(500).json({ message: 'Error getting monthly sessions' });
    }
};

/**
 * Get all months with session counts (for navigation)
 */
exports.getMonthsOverview = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const months = [];

        for (let m = 0; m < 12; m++) {
            months.push({
                month: m,
                name: new Date(currentYear, m).toLocaleDateString('es-ES', { month: 'long' }),
                year: currentYear
            });
        }

        res.json({ year: currentYear, months });
    } catch (error) {
        console.error('Months overview error:', error);
        res.status(500).json({ message: 'Error getting months' });
    }
};

/**
 * Get therapist's own billing data
 */
exports.getMyBillingData = async (req, res) => {
    try {
        const { therapist_id } = req.user;

        if (!therapist_id) {
            return res.status(400).json({ message: 'User is not linked to a therapist profile' });
        }

        const result = await pool.query(
            'SELECT * FROM therapist_billing_data WHERE therapist_id = $1',
            [therapist_id]
        );

        if (result.rows.length === 0) {
            // Return empty data structure
            return res.json({
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
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get billing data error:', error);
        res.status(500).json({ message: 'Error getting billing data' });
    }
};

/**
 * Update therapist's own billing data
 */
exports.updateMyBillingData = async (req, res) => {
    try {
        const { therapist_id } = req.user;
        const { full_name, nif, address_line1, address_line2, city, postal_code, iban, phone, email } = req.body;

        if (!therapist_id) {
            return res.status(400).json({ message: 'User is not linked to a therapist profile' });
        }

        // Check if record exists
        const existing = await pool.query(
            'SELECT id FROM therapist_billing_data WHERE therapist_id = $1',
            [therapist_id]
        );

        if (existing.rows.length === 0) {
            // Insert new record
            await pool.query(
                `INSERT INTO therapist_billing_data 
                (therapist_id, full_name, nif, address_line1, address_line2, city, postal_code, iban, phone, email)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [therapist_id, full_name, nif, address_line1, address_line2, city, postal_code, iban, phone, email]
            );
        } else {
            // Update existing record
            await pool.query(
                `UPDATE therapist_billing_data 
                SET full_name = $1, nif = $2, address_line1 = $3, address_line2 = $4,
                    city = $5, postal_code = $6, iban = $7, phone = $8, email = $9, updated_at = NOW()
                WHERE therapist_id = $10`,
                [full_name, nif, address_line1, address_line2, city, postal_code, iban, phone, email, therapist_id]
            );
        }

        res.json({ message: 'Billing data updated successfully' });
    } catch (error) {
        console.error('Update billing data error:', error);
        res.status(500).json({ message: 'Error updating billing data' });
    }
};

/**
 * Get center billing data (all users can view)
 */
exports.getCenterBillingData = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM center_billing_data ORDER BY id LIMIT 1');

        if (result.rows.length === 0) {
            return res.json({
                name: 'Esencialmente Psicología',
                legal_name: '',
                nif: '',
                address_line1: '',
                address_line2: '',
                city: '',
                postal_code: ''
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get center data error:', error);
        res.status(500).json({ message: 'Error getting center data' });
    }
};

/**
 * Update center billing data (admin only)
 */
exports.updateCenterBillingData = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update center data' });
        }

        const { name, legal_name, nif, address_line1, address_line2, city, postal_code } = req.body;

        // Check if record exists
        const existing = await pool.query('SELECT id FROM center_billing_data LIMIT 1');

        if (existing.rows.length === 0) {
            // Insert new record
            await pool.query(
                `INSERT INTO center_billing_data 
                (name, legal_name, nif, address_line1, address_line2, city, postal_code)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [name, legal_name, nif, address_line1, address_line2, city, postal_code]
            );
        } else {
            // Update existing record
            await pool.query(
                `UPDATE center_billing_data 
                SET name = $1, legal_name = $2, nif = $3, address_line1 = $4,
                    address_line2 = $5, city = $6, postal_code = $7, updated_at = NOW()
                WHERE id = (SELECT id FROM center_billing_data LIMIT 1)`,
                [name, legal_name, nif, address_line1, address_line2, city, postal_code]
            );
        }

        res.json({ message: 'Center data updated successfully' });
    } catch (error) {
        console.error('Update center data error:', error);
        res.status(500).json({ message: 'Error updating center data' });
    }
};

/**
 * Submit invoice for a month
 */
exports.submitInvoice = async (req, res) => {
    try {
        const { therapist_id } = req.user;
        const {
            month,
            year,
            subtotal,
            center_percentage,
            center_amount,
            irpf_percentage,
            irpf_amount,
            total_amount,
            invoice_number,
            excluded_session_ids // New field
        } = req.body;

        console.log('Submitting invoice with data:', {
            therapist_id, year, month, invoice_number,
            invoice_number_type: typeof invoice_number,
            excluded_count: excluded_session_ids?.length
        }); // DEBUG

        if (!therapist_id) {
            return res.status(400).json({ message: 'User is not linked to a therapist profile' });
        }

        // Get therapist name for email
        const therapists = await getAllTherapists();
        const me = therapists.find(t => t.id === therapist_id);
        const therapistName = me ? me.full_name : 'Terapeuta';

        // Check if invoice already submitted
        const existing = await pool.query(
            'SELECT id FROM invoice_submissions WHERE therapist_id = $1 AND month = $2 AND year = $3',
            [therapist_id, month, year]
        );

        // Prepare exclusions JSON
        const exclusions = JSON.stringify(excluded_session_ids || []);
        const excludedCount = excluded_session_ids ? excluded_session_ids.length : 0;

        if (existing.rows.length > 0) {
            // Update existing submission
            await pool.query(
                `UPDATE invoice_submissions 
                SET subtotal = $1, center_percentage = $2, center_amount = $3, 
                    irpf_percentage = $4, irpf_amount = $5, total_amount = $6, 
                    invoice_number = $7, excluded_session_ids = $8, submitted_at = NOW()
                WHERE therapist_id = $9 AND month = $10 AND year = $11`,
                [subtotal, center_percentage, center_amount, irpf_percentage, irpf_amount, total_amount, invoice_number || null, exclusions, therapist_id, month, year]
            );
        } else {
            // Insert new submission
            await pool.query(
                `INSERT INTO invoice_submissions 
                (therapist_id, month, year, subtotal, center_percentage, center_amount, irpf_percentage, irpf_amount, total_amount, invoice_number, excluded_session_ids)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [therapist_id, month, year, subtotal, center_percentage, center_amount, irpf_percentage, irpf_amount, total_amount, invoice_number || null, exclusions]
            );
        }

        // --- Send Email Notification to Admin ---
        if (process.env.RESEND_API_KEY) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const monthName = new Date(year, month).toLocaleDateString('es-ES', { month: 'long' });
                const adminEmail = 'abecerrapsicologa@gmail.com'; // Target email from requirements

                let exclusionWarning = '';
                if (excludedCount > 0) {
                    exclusionWarning = `
                        <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 10px; margin: 10px 0; border-radius: 4px;">
                            <strong>⚠️ Atención:</strong> Esta factura excluye explicitamente <strong>${excludedCount} sesión(es)</strong> del total mensual.
                        </div>
                    `;
                }

                await resend.emails.send({
                    from: 'Esencialmente Psicología <facturacion@esencialmentepsicologia.com>',
                    to: [adminEmail],
                    subject: `Nueva Factura Presentada - ${therapistName} - ${monthName} ${year}`,
                    html: `
                        <h2>Nueva Factura Presentada</h2>
                        <p><strong>Terapeuta:</strong> ${therapistName}</p>
                        <p><strong>Período:</strong> ${monthName} ${year}</p>
                        <hr>
                        <h3>Resumen</h3>
                        <ul>
                            <li><strong>Subtotal:</strong> ${subtotal}€</li>
                            <li><strong>Retención Centro (${center_percentage}%):</strong> ${center_amount}€</li>
                            <li><strong>IRPF (${irpf_percentage}%):</strong> ${irpf_amount}€</li>
                            <li><strong>Total a Percibir:</strong> ${total_amount}€</li>
                        </ul>
                        ${exclusionWarning}
                        <p>
                            <a href="https://esencialmentepsicologia.onrender.com/admin/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Ver Factura en Panel Admin
                            </a>
                        </p>
                    `
                });
                console.log('Factura notification email sent to admin');
            } catch (emailError) {
                console.error('Error sending invoice email:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.json({ message: existing.rows.length > 0 ? 'Factura actualizada correctamente' : 'Factura presentada correctamente' });
    } catch (error) {
        console.error('Error submitting invoice:', error);
        res.status(500).json({ message: 'Error presenting invoice' });
    }
};

/**
 * Check if invoice is submitted
 */
exports.checkInvoiceStatus = async (req, res) => {
    try {
        const { therapist_id } = req.user;
        const { month, year } = req.query;

        if (!therapist_id) {
            return res.status(400).json({ message: 'User is not linked to a therapist profile' });
        }

        const result = await pool.query(
            'SELECT * FROM invoice_submissions WHERE therapist_id = $1 AND month = $2 AND year = $3',
            [therapist_id, month, year]
        );

        if (result.rows.length > 0) {
            return res.json({
                submitted: true,
                submission: result.rows[0]
            });
        }

        res.json({ submitted: false });
    } catch (error) {
        console.error('Error checking invoice status:', error);
        res.status(500).json({ message: 'Error checking invoice status' });
    }
};

/**
 * Validate (approve) a submitted invoice
 */
exports.validateInvoiceSubmission = async (req, res) => {
    try {
        const { therapistId, month, year, validated, paymentDate } = req.body;

        // Get user ID
        const userRes = await pool.query('SELECT id FROM users WHERE therapist_id = $1', [therapistId]);
        const targetUserId = userRes.rows[0]?.id;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `UPDATE invoice_submissions
                 SET validated = $1, payment_date = $2
                 WHERE therapist_id = $3 AND month = $4 AND year = $5`,
                [validated, paymentDate || null, therapistId, month, year]
            );

            // Create notification
            if (targetUserId && validated) {
                const monthName = new Date(year, month).toLocaleDateString('es-ES', { month: 'long' });
                const message = `Tu factura de ${monthName} ${year} ha sido validada y está en proceso de pago.`;

                await client.query(
                    `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'success')`,
                    [targetUserId, message]
                );
            }

            await client.query('COMMIT');
            res.json({ message: 'Estado de factura actualizado y terapeuta notificado' });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error validating invoice:', error);
        res.status(500).json({ message: 'Error validating invoice' });
    }
};

/**
 * Revoke (delete) a submitted invoice
 */
/**
 * Revoke (delete) a submitted invoice
 */
exports.revokeInvoiceSubmission = async (req, res) => {
    try {
        const { therapistId, month, year } = req.body;

        // Get therapist user_id first to send notification
        // WE assume there is a mapping or we can get it from therapist table if it had user_id
        // For now, let's assuming therapist_id IS the user_id or close enough in this specific app structure 
        // (Wait, looking at auth middleware, req.user payload has { id, therapist_id, role })
        // We need to find the user_id associated with this therapist_id. 
        // If the 'users' table has 'therapist_id', we can find it.

        // Let's first get the user ID associated with this therapist ID
        const userRes = await pool.query('SELECT id FROM users WHERE therapist_id = $1', [therapistId]);
        const targetUserId = userRes.rows[0]?.id;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Delete submission
            await client.query(
                `DELETE FROM invoice_submissions
                 WHERE therapist_id = $1 AND month = $2 AND year = $3`,
                [therapistId, month, year]
            );

            // 2. Create notification if user exists
            if (targetUserId) {
                const monthName = new Date(year, month).toLocaleDateString('es-ES', { month: 'long' });
                const message = `Tu factura de ${monthName} ${year} ha sido revocada por el administrador. Por favor, revísala y vuélvela a presentar.`;

                await client.query(
                    `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'warning')`,
                    [targetUserId, message]
                );
            }

            await client.query('COMMIT');
            res.json({ message: 'Factura revocada y terapeuta notificado' });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error revoking invoice:', error);
        res.status(500).json({ message: 'Error revoking invoice' });
    }
};

/**
 * Get all invoice submissions for a specific month (Admin)
 */
exports.getInvoiceSubmissions = async (req, res) => {
    try {
        const { month, year } = req.query;

        const result = await pool.query(
            `SELECT s.*, t.full_name as therapist_name, t.id as therapist_id
             FROM invoice_submissions s
             LEFT JOIN therapists t ON s.therapist_id = t.id
             WHERE s.month = $1 AND s.year = $2
             ORDER BY s.submitted_at DESC`,
            [month, year]
        );
        console.log(`Found ${result.rows.length} submissions`);


        res.json(result.rows);
    } catch (error) {
        console.error('Error getting invoice submissions:', error);
        res.status(500).json({ message: 'Error getting invoice submissions' });
    }
};

/**
 * Get unreviewed payment summary for a therapist (Admin only)
 * Returns totals by payment type for sessions not yet reviewed by admin
 */
exports.getReviewSummary = async (req, res) => {
    try {
        const { role } = req.user;
        const { therapistId, startDate, endDate } = req.query;

        if (role !== 'admin') {
            return res.status(403).json({ message: 'Solo el administrador puede ver el resumen de revisión.' });
        }

        if (!therapistId) {
            return res.status(400).json({ message: 'therapistId requerido' });
        }

        // Get unreviewed paid sessions for this therapist
        const result = await pool.query(`
            SELECT 
                sp.payment_type,
                COUNT(*) as session_count,
                SUM(COALESCE(sp.modified_price, sp.original_price, 55)) as total_amount
            FROM session_payments sp
            WHERE sp.therapist_id = $1
              AND sp.payment_type IN ('transfer', 'cash')
              AND sp.reviewed_at IS NULL
              AND ($2::date IS NULL OR sp.session_date >= $2)
              AND ($3::date IS NULL OR sp.session_date <= $3)
            GROUP BY sp.payment_type
        `, [therapistId, startDate || null, endDate || null]);

        const summary = {
            cash: { count: 0, amount: 0 },
            transfer: { count: 0, amount: 0 }
        };

        result.rows.forEach(row => {
            if (row.payment_type === 'cash') {
                summary.cash.count = parseInt(row.session_count);
                summary.cash.amount = parseFloat(row.total_amount);
            } else if (row.payment_type === 'transfer') {
                summary.transfer.count = parseInt(row.session_count);
                summary.transfer.amount = parseFloat(row.total_amount);
            }
        });

        res.json({ summary, therapistId });

    } catch (error) {
        console.error('Error getting review summary:', error);
        res.status(500).json({ message: 'Error getting review summary' });
    }
};

/**
 * Mark sessions as reviewed by admin
 * For cash: verifies amount matches before marking
 * For transfer: just marks as reviewed
 */
exports.reviewPayments = async (req, res) => {
    try {
        const { role, id: adminId } = req.user;
        const { therapistId, paymentType, confirmedAmount, startDate, endDate, eventIds } = req.body;

        if (role !== 'admin') {
            return res.status(403).json({ message: 'Solo el administrador puede marcar revisiones.' });
        }

        if (!therapistId || !paymentType) {
            return res.status(400).json({ message: 'therapistId y paymentType requeridos' });
        }

        if (!['cash', 'transfer'].includes(paymentType)) {
            return res.status(400).json({ message: 'paymentType debe ser "cash" o "transfer"' });
        }

        // Build query conditions
        let query = `
            SELECT 
                sp.id, sp.event_id,
                COALESCE(sp.modified_price, sp.original_price, 55) as price
            FROM session_payments sp
            WHERE sp.therapist_id = $1
              AND sp.payment_type = $2
              AND sp.reviewed_at IS NULL
        `;

        const params = [therapistId, paymentType];
        let paramIdx = 3;

        if (eventIds && Array.isArray(eventIds) && eventIds.length > 0) {
            query += ` AND sp.event_id = ANY($${paramIdx})`;
            params.push(eventIds);
            paramIdx++;
        } else {
            // Only use date filters if specific IDs are not provided (legacy behavior)
            if (startDate) {
                query += ` AND sp.session_date >= $${paramIdx}`;
                params.push(startDate);
                paramIdx++;
            }
            if (endDate) {
                query += ` AND sp.session_date <= $${paramIdx}`;
                params.push(endDate);
                paramIdx++;
            }
        }

        const unreviewedResult = await pool.query(query, params);

        const sessions = unreviewedResult.rows;
        const expectedTotal = sessions.reduce((sum, s) => sum + parseFloat(s.price), 0);

        // For cash, verify the amount matches
        if (paymentType === 'cash') {
            if (confirmedAmount === undefined || confirmedAmount === null) {
                return res.status(400).json({
                    message: 'Para efectivo, debes confirmar la cantidad recogida.',
                    expectedAmount: expectedTotal
                });
            }

            const confirmed = parseFloat(confirmedAmount);
            if (Math.abs(confirmed - expectedTotal) > 0.01) {
                return res.status(400).json({
                    message: `La cantidad confirmada (${confirmed}€) no coincide con el total esperado (${expectedTotal}€). Revisa las sesiones o ajusta la cantidad.`,
                    expectedAmount: expectedTotal,
                    confirmedAmount: confirmed
                });
            }
        }

        // Mark all matching sessions as reviewed
        const sessionIds = sessions.map(s => s.id);
        if (sessionIds.length > 0) {
            await pool.query(`
                UPDATE session_payments 
                SET reviewed_at = NOW(), reviewed_by = $1
                WHERE id = ANY($2)
            `, [adminId, sessionIds]);
        }

        res.json({
            success: true,
            reviewedCount: sessionIds.length,
            reviewedAmount: expectedTotal,
            paymentType
        });

    } catch (error) {
        console.error('Error reviewing payments:', error);
        res.status(500).json({ message: 'Error reviewing payments' });
    }
};

/**
 * Toggle review status for a single session
 */
exports.toggleReviewStatus = async (req, res) => {
    try {
        const { id } = req.user; // Admin ID
        const { eventId, reviewed } = req.body;
        console.log('Toggling review:', { eventId, reviewed, adminId: id });

        if (!eventId) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        if (reviewed) {
            // Mark as reviewed
            await pool.query(`
                UPDATE session_payments 
                SET reviewed_at = NOW(), reviewed_by = $1
                WHERE event_id = $2
            `, [id, eventId]);
        } else {
            // Unmark (remove review)
            await pool.query(`
                UPDATE session_payments 
                SET reviewed_at = NULL, reviewed_by = NULL
                WHERE event_id = $1
            `, [eventId]);
        }

        res.json({ success: true, reviewed });
    } catch (error) {
        console.error('Toggle review error:', error);
        res.status(500).json({ message: 'Error toggling review status' });
    }
};

/**
 * Get all invoice submissions for admin dashboard
 */
exports.getInvoiceSubmissions = async (req, res) => {
    try {
        const { year, month, therapistId } = req.query;

        let query = `
            SELECT i.*, t.full_name as therapist_name, t.calendar_color_id as therapist_color_id
            FROM invoice_submissions i
            JOIN therapists t ON i.therapist_id = t.id
            WHERE 1=1
        `;
        const params = [];
        let paramIdx = 1;

        if (year) {
            query += ` AND i.year = $${paramIdx}`;
            params.push(year);
            paramIdx++;
        }

        if (month) {
            query += ` AND i.month = $${paramIdx}`;
            params.push(month);
            paramIdx++;
        }

        if (therapistId) {
            query += ` AND i.therapist_id = $${paramIdx}`;
            params.push(therapistId);
            paramIdx++;
        }

        query += ` ORDER BY i.submitted_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            submissions: result.rows
        });
    } catch (error) {
        console.error('Error fetching invoice submissions:', error);
        res.status(500).json({ message: 'Error al obtener facturas' });
    }
};


/**
 * Revoke (delete) an invoice submission
 * Allows therapist to resubmit correctly.
 */
exports.revokeInvoiceSubmission = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'Submission ID required' });
        }

        // Delete the submission
        await pool.query('DELETE FROM invoice_submissions WHERE id = $1', [id]);

        res.json({ success: true, message: 'Factura devuelta (eliminada) correctamente' });
    } catch (error) {
        console.error('Error revoking invoice:', error);
        res.status(500).json({ message: 'Error al devolver factura' });
    }
};

/**
 * Get details for invoice PDF generation (Admin)
 * Reconstructs the session list and therapist data
 */
exports.getInvoiceDetails = async (req, res) => {
    try {
        const { year, month, therapistId } = req.query;

        if (!therapistId || !year || month === undefined) {
            return res.status(400).json({ message: 'Missing parameters' });
        }

        // 1. Get Therapist Billing Data
        const billingDataRes = await pool.query(
            'SELECT * FROM therapist_billing_data WHERE therapist_id = $1',
            [therapistId]
        );
        const therapistData = billingDataRes.rows[0] || {};

        // 2. Get Therapist Info (for name fallback)
        const therapists = await getAllTherapists();
        const therapist = therapists.find(t => t.id === parseInt(therapistId));
        if (!therapistData.full_name && therapist) {
            therapistData.full_name = therapist.full_name;
        }

        // 3. Get Sessions for that month
        const y = parseInt(year);
        const m = parseInt(month);
        const startDate = new Date(y, m, 1);
        const endDate = new Date(y, m + 1, 0, 23, 59, 59);

        // Uses existing getSessions helper (assumes it's available in scope or imported)
        // We know getSessions is defined in this file or imported. 
        // Checking previous file reads, it seems getSessions calls google calendar.
        // However, for invoices we should rely on what was persisted if possible?
        // But the system design seems to rely on fetching from Calendar + SessionPayments DB.

        const allSessions = await getSessions(
            CALENDAR_ID,
            startDate,
            endDate,
            null
        );

        const sessions = allSessions.filter(s => s.therapistId === parseInt(therapistId));

        // Get payment status to attach prices
        const sessionIds = sessions.map(s => s.id);

        let paymentMap = {};
        if (sessionIds.length > 0) {
            const paymentResult = await pool.query(
                `SELECT event_id, payment_type, marked_at, original_price, modified_price 
                 FROM session_payments 
                 WHERE event_id = ANY($1) AND therapist_id = $2`,
                [sessionIds, therapistId]
            );

            paymentResult.rows.forEach(p => {
                paymentMap[p.event_id] = p;
            });
        }

        const processedSessions = [];
        sessions.forEach(session => {
            const payment = paymentMap[session.id];

            // Default price logic matches getMonthlyTherapistSessions
            if (payment) {
                if (payment.original_price) session.price = parseFloat(payment.original_price);
                if (payment.modified_price) session.price = parseFloat(payment.modified_price);
                session.paymentStatus = payment.payment_type;
            } else {
                session.paymentStatus = 'pending';
            }

            // Only include potentially billable sessions (even if excluded later by ID)
            // The frontend filters exclusions. We just provide the raw list.
            if (session.price > 0 && session.paymentStatus !== 'cancelled' && !session.isLibre) {
                processedSessions.push(session);
            }
        });

        res.json({
            therapistData,
            sessions: processedSessions
        });

    } catch (error) {
        console.error('Error getting invoice details:', error);
        res.status(500).json({ message: 'Error getting invoice details' });
    }
};
