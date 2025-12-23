/**
 * Session Sync Service
 * Sincroniza eventos de Google Calendar con la base de datos local
 */

const { pool } = require('../config/db');
const { getRawEvents, detectTherapist, isNonBillable } = require('./calendarService');

/**
 * Parsear el título del evento para extraer nombre del paciente
 * Quita patrones como /nombre/ que identifican al terapeuta
 */
const parsePatientName = (title) => {
    if (!title) return null;

    // Quitar el patrón /nombre/ que identifica al terapeuta
    let cleaned = title.replace(/\/[^\/]+\//g, '').trim();

    // Quitar palabras comunes que no son nombres de pacientes
    const nonPatientPatterns = [
        /^libre$/i,
        /^supervision$/i,
        /^supervisión$/i,
        /^reunion$/i,
        /^reunión$/i,
        /^formacion$/i,
        /^formación$/i,
        /^vacaciones$/i,
        /^festivo$/i,
        /^baja$/i,
    ];

    for (const pattern of nonPatientPatterns) {
        if (pattern.test(cleaned)) {
            return null; // No es un paciente
        }
    }

    return cleaned || null;
};

/**
 * Buscar o crear un paciente por nombre
 */
const findOrCreatePatient = async (client, patientName) => {
    if (!patientName) return null;

    // Buscar paciente existente
    const existing = await client.query(
        'SELECT id FROM patients WHERE LOWER(full_name) = LOWER($1)',
        [patientName]
    );

    if (existing.rows.length > 0) {
        return existing.rows[0].id;
    }

    // Crear nuevo paciente
    const result = await client.query(
        'INSERT INTO patients (full_name) VALUES ($1) RETURNING id',
        [patientName]
    );

    return result.rows[0].id;
};

/**
 * Calcular precio basado en duración
 */
const calculatePrice = (durationMinutes, isBillable) => {
    if (!isBillable) return 0;
    if (durationMinutes <= 60) return 55;
    if (durationMinutes <= 90) return 80;
    return 80; // Default para sesiones largas
};

/**
 * Sincronizar eventos de un rango de fechas
 */
const syncEvents = async (startDate, endDate) => {
    const client = await pool.connect();
    const stats = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        patientsCreated: 0
    };

    try {
        console.log(`🔄 Syncing events from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Obtener eventos de Google Calendar
        const events = await getRawEvents(startDate, endDate);
        console.log(`📅 Found ${events.length} events in Google Calendar`);

        await client.query('BEGIN');

        for (const event of events) {
            try {
                stats.processed++;

                const googleEventId = event.id;
                const title = event.summary || '';
                const startDateTime = event.start.dateTime || event.start.date;
                const endDateTime = event.end.dateTime || event.end.date;

                // Parsear fechas
                const startDT = new Date(startDateTime);
                const endDT = new Date(endDateTime);
                const sessionDate = startDT.toISOString().split('T')[0];
                const startTime = startDT.toTimeString().split(' ')[0];
                const endTime = endDT.toTimeString().split(' ')[0];
                const durationMinutes = Math.round((endDT - startDT) / 60000);

                // Detectar terapeuta
                const therapistInfo = detectTherapist(title);
                const therapistId = therapistInfo ? therapistInfo.id : null;

                // Determinar si es facturable
                // Anna (id=1) es gestión, no terapeuta - sus sesiones no son facturables
                const isAnna = therapistInfo && therapistInfo.id === 1;
                const isBillable = !isNonBillable(title) && !isAnna;

                // Parsear nombre del paciente
                const patientName = parsePatientName(title);
                let patientId = null;

                if (patientName && isBillable) {
                    patientId = await findOrCreatePatient(client, patientName);
                    if (patientId && !stats.patientsCreated) {
                        // Contar solo si es nuevo (simplificado)
                    }
                }

                // Calcular precio
                const price = calculatePrice(durationMinutes, isBillable);

                // Determinar estado
                let status = 'scheduled';
                if (new Date(sessionDate) < new Date()) {
                    status = 'completed'; // Sesiones pasadas se marcan como completadas
                }

                // Upsert en la base de datos
                const upsertResult = await client.query(`
                    INSERT INTO sessions (
                        google_event_id, therapist_id, patient_id, title,
                        session_date, start_time, end_time, duration_minutes,
                        price, is_billable, status, synced_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                    ON CONFLICT (google_event_id) 
                    DO UPDATE SET
                        therapist_id = EXCLUDED.therapist_id,
                        patient_id = EXCLUDED.patient_id,
                        title = EXCLUDED.title,
                        session_date = EXCLUDED.session_date,
                        start_time = EXCLUDED.start_time,
                        end_time = EXCLUDED.end_time,
                        duration_minutes = EXCLUDED.duration_minutes,
                        price = EXCLUDED.price,
                        is_billable = EXCLUDED.is_billable,
                        synced_at = NOW(),
                        updated_at = NOW()
                    RETURNING (xmax = 0) as is_insert
                `, [
                    googleEventId, therapistId, patientId, title,
                    sessionDate, startTime, endTime, durationMinutes,
                    price, isBillable, status
                ]);

                if (upsertResult.rows[0].is_insert) {
                    stats.created++;
                } else {
                    stats.updated++;
                }

            } catch (eventError) {
                console.error(`Error processing event ${event.id}:`, eventError.message);
                stats.errors++;
            }
        }

        // Migrar datos de session_payments a la nueva estructura
        await client.query(`
            UPDATE session_payments sp
            SET session_id = s.id
            FROM sessions s
            WHERE sp.event_id = s.google_event_id
            AND sp.session_id IS NULL
        `);

        await client.query('COMMIT');

        console.log('✅ Sync completed:', stats);
        return stats;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Sync failed:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Sincronizar el año actual
 */
const syncCurrentYear = async () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    return syncEvents(startOfYear, endOfYear);
};

/**
 * Sincronizar el mes actual
 */
const syncCurrentMonth = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return syncEvents(startOfMonth, endOfMonth);
};

/**
 * Sincronizar los últimos N días
 */
const syncLastDays = async (days = 30) => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    return syncEvents(startDate, now);
};

module.exports = {
    syncEvents,
    syncCurrentYear,
    syncCurrentMonth,
    syncLastDays,
    parsePatientName,
    findOrCreatePatient
};
