const pool = require('../config/db');

/**
 * Get expenses with optional filters
 */
exports.getExpenses = async (req, res) => {
    try {
        const { year, month } = req.query;
        let query = 'SELECT * FROM expenses';
        let params = [];

        if (year && month) {
            query += ' WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2';
            params = [year, month];
        }

        query += ' ORDER BY date DESC, created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting expenses:', error);
        res.status(500).json({ message: 'Error getting expenses' });
    }
};

/**
 * Create a new expense
 */
exports.createExpense = async (req, res) => {
    try {
        const { date, category, description, amount, provider } = req.body;

        const result = await pool.query(
            `INSERT INTO expenses (date, category, description, amount, provider)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [date, category, description, amount, provider]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ message: 'Error creating expense' });
    }
};

/**
 * Delete expense
 */
exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
        res.json({ message: 'Gasto eliminado' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense' });
    }
};

/**
 * Get recurring expenses templates
 */
exports.getRecurringExpenses = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM recurring_expenses ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting recurring expenses:', error);
        res.status(500).json({ message: 'Error getting recurring expenses' });
    }
};

/**
 * Create recurring expense template
 */
exports.createRecurringExpense = async (req, res) => {
    try {
        const { category, description, amount, provider } = req.body;

        const result = await pool.query(
            `INSERT INTO recurring_expenses (category, description, amount, provider, active)
             VALUES ($1, $2, $3, $4, true)
             RETURNING *`,
            [category, description, amount, provider]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating recurring expense:', error);
        res.status(500).json({ message: 'Error creating recurring expense' });
    }
};

/**
 * Toggle recurring expense active status or update details
 */
exports.updateRecurringExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, description, amount, provider, active } = req.body;

        const result = await pool.query(
            `UPDATE recurring_expenses 
             SET category = $1, description = $2, amount = $3, provider = $4, active = $5
             WHERE id = $6
             RETURNING *`,
            [category, description, amount, provider, active, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating recurring expense:', error);
        res.status(500).json({ message: 'Error updating recurring expense' });
    }
};

exports.deleteRecurringExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM recurring_expenses WHERE id = $1', [id]);
        res.json({ message: 'Gasto recurrente eliminado' });
    } catch (error) {
        console.error('Error deleting recurring expense:', error);
        res.status(500).json({ message: 'Error deleting recurring expense' });
    }
};

/**
 * GENERATE MONTHLY EXPENSES from recurring templates
 * Copies all active recurring expenses to the expenses table for the given month
 */
exports.generateMonthlyExpenses = async (req, res) => {
    try {
        const { year, month } = req.body;
        const date = `${year}-${String(month + 1).padStart(2, '0')}-01`; // First day of month

        // Get active recurring expenses
        const templates = await pool.query('SELECT * FROM recurring_expenses WHERE active = true');

        if (templates.rows.length === 0) {
            return res.json({ message: 'No hay gastos recurrentes activos para generar', count: 0 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let count = 0;
            for (const item of templates.rows) {
                // Check if already exists for this month (optional, but prevents duplicates if clicked twice)
                // We'll check by matching category, description and exact date
                const existing = await client.query(
                    `SELECT id FROM expenses 
                     WHERE date = $1 AND category = $2 AND description = $3`,
                    [date, item.category, item.description]
                );

                if (existing.rows.length === 0) {
                    await client.query(
                        `INSERT INTO expenses (date, category, description, amount, provider)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [date, item.category, item.description, item.amount, item.provider]
                    );
                    count++;
                }
            }

            await client.query('COMMIT');
            res.json({ message: 'Gastos generados correctamente', count });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error generating monthly expenses:', error);
        res.status(500).json({ message: 'Error generating monthly expenses' });
    }
};
