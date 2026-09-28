const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./config/db');

const migrate = async () => {
    try {
        console.log('🔄 Iniciando migración aditiva para exención de IVA en invoice_submissions...');

        // 1. Columnas nuevas (todas NULL por defecto, sin tocar datos preexistentes)
        await pool.query(`
            ALTER TABLE invoice_submissions 
            ADD COLUMN IF NOT EXISTS vat_treatment VARCHAR(20) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS vat_exemption_reason TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS invoice_snapshot JSONB DEFAULT NULL;
        `);
        console.log('✅ Columnas vat_treatment, vat_exemption_reason y invoice_snapshot aseguradas.');

        // 2. Restricción de dominio segura y retrocompatible
        await pool.query(`
            ALTER TABLE invoice_submissions 
            DROP CONSTRAINT IF EXISTS check_vat_treatment;
        `);
        await pool.query(`
            ALTER TABLE invoice_submissions 
            ADD CONSTRAINT check_vat_treatment 
            CHECK (vat_treatment IS NULL OR vat_treatment IN ('EXEMPT', 'STANDARD'));
        `);
        console.log('✅ Restricción check_vat_treatment añadida con éxito.');

        // 3. Verificación de seguridad: CERO mutación de datos históricos
        const checkRes = await pool.query(`
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE vat_treatment IS NOT NULL) AS migrated_treatments,
                COUNT(*) FILTER (WHERE invoice_snapshot IS NOT NULL) AS migrated_snapshots
            FROM invoice_submissions;
        `);
        const stats = checkRes.rows[0];
        console.log(`📊 Comprobación post-migración: Total facturas: ${stats.total}, Tratamientos no-nulos: ${stats.migrated_treatments}, Snapshots no-nulos: ${stats.migrated_snapshots}`);

        if (parseInt(stats.migrated_treatments) === 0 && parseInt(stats.migrated_snapshots) === 0) {
            console.log('✅ ÉXITO TOTAL: Ninguna factura histórica fue mutada (cero backfill).');
        } else {
            console.warn('⚠️ ATENCIÓN: Se encontraron registros con valores no nulos tras la migración.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando la migración:', error);
        process.exit(1);
    }
};

migrate();
