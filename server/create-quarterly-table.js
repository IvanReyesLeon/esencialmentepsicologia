require('dotenv').config();
const pool = require('./config/db');

const createQuarterlyTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS quarterly_reports (
                id SERIAL PRIMARY KEY,
                year INTEGER NOT NULL,
                quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
                total_revenue DECIMAL(10, 2) DEFAULT 0, -- Facturación total (Entrada)
                therapists_payout DECIMAL(10, 2) DEFAULT 0, -- Salida a Terapeutas
                center_revenue DECIMAL(10, 2) DEFAULT 0, -- Margen Bruto Centro
                expenses_total DECIMAL(10, 2) DEFAULT 0, -- Gastos Operativos
                net_profit DECIMAL(10, 2) DEFAULT 0, -- Beneficio Neto (Center - Expenses)
                notes TEXT,
                status VARCHAR(20) DEFAULT 'draft', -- draft, closed
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(year, quarter)
            );
        `);
        console.log('✅ Created quarterly_reports table');
    } catch (error) {
        console.error('❌ Error creating table:', error);
    }
    // Just exit, the pool wrapper might not expose end() or might handle it.
    process.exit();
};

createQuarterlyTable();
