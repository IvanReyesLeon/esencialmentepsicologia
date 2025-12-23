/**
 * Session Sync Controller
 * Endpoints para sincronizar y gestionar sesiones
 */

const { syncEvents, syncCurrentYear, syncCurrentMonth, syncLastDays } = require('../services/sessionSyncService');
const { pool } = require('../config/db');

/**
 * Sincronizar sesiones del año actual
 */
exports.syncYear = async (req, res) => {
    try {
        const stats = await syncCurrentYear();
        res.json({
            success: true,
            message: 'Sincronización del año completada',
            stats
        });
    } catch (error) {
        console.error('Sync year error:', error);
        res.status(500).json({ message: 'Error en sincronización', error: error.message });
    }
};

/**
 * Sincronizar sesiones del mes actual
 */
exports.syncMonth = async (req, res) => {
    try {
        const stats = await syncCurrentMonth();
        res.json({
            success: true,
            message: 'Sincronización del mes completada',
            stats
        });
    } catch (error) {
        console.error('Sync month error:', error);
        res.status(500).json({ message: 'Error en sincronización', error: error.message });
    }
};

/**
 * Sincronizar últimos N días (default 30)
 */
exports.syncRecent = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await syncLastDays(days);
        res.json({
            success: true,
            message: `Sincronización de los últimos ${days} días completada`,
            stats
        });
    } catch (error) {
        console.error('Sync recent error:', error);
        res.status(500).json({ message: 'Error en sincronización', error: error.message });
    }
};

/**
 * Sincronizar rango personalizado
 */
exports.syncRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate y endDate son requeridos' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const stats = await syncEvents(start, end);
        res.json({
            success: true,
            message: 'Sincronización completada',
            stats
        });
    } catch (error) {
        console.error('Sync range error:', error);
        res.status(500).json({ message: 'Error en sincronización', error: error.message });
    }
};

/**
 * Obtener estadísticas de sincronización
 */
exports.getSyncStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(*) FILTER (WHERE is_billable = true) as billable_sessions,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_sessions,
                COUNT(DISTINCT therapist_id) as therapists_with_sessions,
                COUNT(DISTINCT patient_id) as unique_patients,
                MIN(session_date) as earliest_session,
                MAX(session_date) as latest_session,
                MAX(synced_at) as last_sync
            FROM sessions
        `);

        const patientsCount = await pool.query('SELECT COUNT(*) as total FROM patients');

        res.json({
            sessions: result.rows[0],
            patients: {
                total: parseInt(patientsCount.rows[0].total)
            }
        });
    } catch (error) {
        console.error('Get sync stats error:', error);
        res.status(500).json({ message: 'Error obteniendo estadísticas' });
    }
};

/**
 * Obtener resumen de facturación mensual
 */
exports.getMonthlyBilling = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = parseInt(year) || new Date().getFullYear();

        const result = await pool.query(`
            SELECT 
                t.id as therapist_id,
                t.full_name as therapist_name,
                EXTRACT(MONTH FROM s.session_date) as month,
                COUNT(*) as total_sessions,
                COUNT(*) FILTER (WHERE s.is_billable = true AND s.status != 'cancelled') as billable_sessions,
                COUNT(*) FILTER (WHERE s.status = 'cancelled') as cancelled_sessions,
                SUM(s.duration_minutes) FILTER (WHERE s.status != 'cancelled') as total_minutes,
                SUM(s.price) FILTER (WHERE s.is_billable = true AND s.status != 'cancelled') as total_revenue,
                SUM(CASE WHEN sp.payment_type IN ('cash', 'transfer', 'bizum') THEN s.price ELSE 0 END) as paid_amount
            FROM sessions s
            JOIN therapists t ON s.therapist_id = t.id
            LEFT JOIN session_payments sp ON s.google_event_id = sp.event_id
            WHERE EXTRACT(YEAR FROM s.session_date) = $1
            AND s.is_billable = true
            GROUP BY t.id, t.full_name, EXTRACT(MONTH FROM s.session_date)
            ORDER BY month DESC, therapist_name
        `, [targetYear]);

        res.json({
            year: targetYear,
            data: result.rows
        });
    } catch (error) {
        console.error('Get monthly billing error:', error);
        res.status(500).json({ message: 'Error obteniendo facturación mensual' });
    }
};

/**
 * Obtener lista de pacientes
 */
exports.getPatients = async (req, res) => {
    try {
        const { search, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT p.*, 
                   COUNT(s.id) as session_count,
                   MAX(s.session_date) as last_session
            FROM patients p
            LEFT JOIN sessions s ON p.id = s.patient_id
        `;

        const params = [];

        if (search) {
            query += ' WHERE LOWER(p.full_name) LIKE LOWER($1)';
            params.push(`%${search}%`);
        }

        query += ' GROUP BY p.id ORDER BY p.full_name';
        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            patients: result.rows
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ message: 'Error obteniendo pacientes' });
    }
};

/**
 * Obtener sesiones de un paciente específico
 */
exports.getPatientSessions = async (req, res) => {
    try {
        const { patientId } = req.params;

        const result = await pool.query(`
            SELECT 
                s.*,
                t.full_name as therapist_name,
                sp.payment_type as payment_status
            FROM sessions s
            LEFT JOIN therapists t ON s.therapist_id = t.id
            LEFT JOIN session_payments sp ON s.google_event_id = sp.event_id
            WHERE s.patient_id = $1
            ORDER BY s.session_date DESC, s.start_time DESC
        `, [patientId]);

        res.json({
            sessions: result.rows
        });
    } catch (error) {
        console.error('Get patient sessions error:', error);
        res.status(500).json({ message: 'Error obteniendo sesiones del paciente' });
    }
};

/**
 * Obtener log de auditoría de pagos
 */
exports.getAuditLog = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await pool.query(`
            SELECT 
                al.*,
                u.username as user_username
            FROM payment_audit_log al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await pool.query('SELECT COUNT(*) FROM payment_audit_log');

        res.json({
            logs: result.rows,
            total: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        console.error('Get audit log error:', error);
        res.status(500).json({ message: 'Error obteniendo log de auditoría' });
    }
};

/**
 * Actualizar datos de un paciente
 */
exports.updatePatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { email, phone, notes, preferred_payment_method } = req.body;

        const result = await pool.query(`
            UPDATE patients 
            SET 
                email = COALESCE($1, email),
                phone = COALESCE($2, phone),
                notes = COALESCE($3, notes),
                preferred_payment_method = COALESCE($4, preferred_payment_method),
                updated_at = NOW()
            WHERE id = $5
            RETURNING *
        `, [email, phone, notes, preferred_payment_method, patientId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }

        res.json({
            success: true,
            patient: result.rows[0]
        });
    } catch (error) {
        console.error('Update patient error:', error);
        res.status(500).json({ message: 'Error actualizando paciente' });
    }
};
