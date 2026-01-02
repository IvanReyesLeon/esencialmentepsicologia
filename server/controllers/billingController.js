const {
    getSessions,
    getWeeklySummary,
    getWeeksOfMonth,
    getRawEvents,
    detectTherapist,
    isNonBillable
} = require('../services/calendarService');
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

                if (payment && payment.payment_type !== 'cancelled') {
                    paidAmount += session.price;
                    paidCount++;
                } else if (!payment || payment.payment_type === 'pending') {
                    pendingAmount += session.price;
                    pendingCount++;
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
                `SELECT event_id, payment_type, marked_at 
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

            // Solo contar sesiones facturables (precio > 0 y no canceladas)
            if (session.price > 0 && session.paymentStatus !== 'cancelled') {
                billableSessions++;
                if (payment && payment.payment_type !== 'cancelled' && payment.payment_type !== 'pending') {
                    paidAmount += session.price;
                    paidSessions++;
                } else {
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
        const paymentsRes = await pool.query(`SELECT * FROM session_payments`);
        const paymentsMap = {};
        paymentsRes.rows.forEach(p => {
            paymentsMap[p.event_id] = p;
        });

        // 3. Process events
        const processedSessions = events
            .map(event => {
                // Detect therapist
                const detected = detectTherapist(event.summary || '');
                if (!detected && !process.env.IncludeUnknown) return null; // Skip if strict

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
                if (queryTherapistId && session.therapistId !== queryTherapistId) {
                    return null;
                }

                // Skip 'Unknown' if we only want assigned
                if (sessionTherapistId === 'unknown') return null;

                // Check "Libre"
                if (isNonBillable(session.title)) {
                    session.isLibre = true;
                    session.price = 0;
                } else {
                    session.isLibre = false;
                    session.price = 55; // Default price
                }

                // Attach Payment Info
                if (paymentsMap[session.id]) {
                    session.paymentStatus = paymentsMap[session.id].payment_type;
                    session.paidAt = paymentsMap[session.id].marked_at;
                    session.paymentDate = paymentsMap[session.id].payment_date;
                } else {
                    session.paymentStatus = 'pending';
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
        const { therapist_id } = req.user;
        const { eventId } = req.params;
        const { paymentType, paymentDate } = req.body; // 'transfer' | 'cash' | 'cancelled' | null

        if (!therapist_id) {
            return res.status(400).json({ message: 'User is not linked to a therapist profile' });
        }

        if (!eventId) {
            return res.status(400).json({ message: 'Event ID required' });
        }

        // Get existing payment status for audit log
        const existingPaymentResult = await pool.query(
            `SELECT payment_type FROM session_payments WHERE event_id = $1`,
            [eventId]
        );
        const oldStatus = existingPaymentResult.rows[0]?.payment_type || 'pending';

        // Check permissions: Therapists cannot modify 'paid' sessions
        if (req.user.role !== 'admin') {
            if (oldStatus !== 'pending' && oldStatus !== 'cancelled') {
                return res.status(403).json({ message: 'No tienes permiso para modificar un pago ya procesado.' });
            }
        }

        if (paymentType === null || paymentType === 'pending') {
            // Remove payment record
            await pool.query(
                `DELETE FROM session_payments WHERE event_id = $1 AND therapist_id = $2`,
                [eventId, therapist_id]
            );
        } else {
            // Upsert payment record with optional payment_date
            await pool.query(
                `INSERT INTO session_payments (event_id, therapist_id, payment_type, marked_at, payment_date)
                 VALUES ($1, $2, $3, NOW(), $4)
                 ON CONFLICT (event_id) 
                 DO UPDATE SET payment_type = $3, marked_at = NOW(), payment_date = $4`,
                [eventId, therapist_id, paymentType, paymentDate || null]
            );
        }

        // Log the change in audit table
        const action = paymentType === 'pending' || paymentType === null ? 'reverted' :
            oldStatus === 'pending' ? 'marked_paid' : 'changed';

        await pool.query(`
            INSERT INTO payment_audit_log 
            (event_id, user_id, user_name, action, old_status, new_status, payment_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            eventId,
            req.user.id,
            req.user.username || req.user.email,
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
                `SELECT event_id, payment_type, marked_at 
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
            session.paymentStatus = payment ? payment.payment_type : 'pending';
            session.markedAt = payment?.marked_at || null;

            // Only count billable sessions (price > 0 and not cancelled/free)
            if (session.price > 0 && session.paymentStatus !== 'cancelled' && !session.isLibre) {
                billableSessions.push(session);
                totalAmount += session.price;

                // Check if pending
                if (session.paymentStatus === 'pending') {
                    pendingCount++;
                }
            }
        });

        // TODO: UNCOMMENT THIS AFTER TESTING - Pending sessions validation
        // If there are pending sessions, return error
        /* if (pendingCount > 0) {
            return res.status(400).json({
                error: true,
                hasPending: true,
                pendingCount,
                message: `Tienes ${pendingCount} sesión${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''} de revisar en este mes. Por favor, márcalas como revisadas antes de generar la factura.`
            });
        } */

        // Return sessions for invoice
        res.json({
            therapist: me.full_name,
            year: y,
            month: m,
            sessions: billableSessions,
            hasPending: false,
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
