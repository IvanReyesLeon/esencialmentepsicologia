const pool = require('../config/db');

/**
 * Helper to get months for a quarter (0-indexed)
 * Q1: 0,1,2 (Jan, Feb, Mar)
 * Q2: 3,4,5
 * Q3: 6,7,8
 * Q4: 9,10,11
 */
const getQuarterMonths = (quarter) => {
    const startMonth = (quarter - 1) * 3;
    return [startMonth, startMonth + 1, startMonth + 2];
};

/**
 * Get Quarterly Report (Saved or Live)
 */
exports.getQuarterlyReport = async (req, res) => {
    try {
        const { year, quarter } = req.query;

        if (!year || !quarter) {
            return res.status(400).json({ message: 'Year and Quarter are required' });
        }

        // 1. Check if saved report exists
        const savedReport = await pool.query(
            'SELECT * FROM quarterly_reports WHERE year = $1 AND quarter = $2',
            [year, quarter]
        );

        if (savedReport.rows.length > 0) {
            return res.json({
                source: 'database',
                data: savedReport.rows[0]
            });
        }

        // 2. Live Calculation
        const months = getQuarterMonths(Number(quarter));
        const startDate = `${year}-${String(months[0] + 1).padStart(2, '0')}-01`;

        // End date: Last day of the last month of quarter
        const lastMonth = months[2];
        const lastDay = new Date(year, lastMonth + 1, 0).getDate(); // Get last day of that month
        const endDate = `${year}-${String(lastMonth + 1).padStart(2, '0')}-${lastDay}`;


        // A. Fetch Invoice Submissions (Income)
        // Summing up all submissions for the months in this quarter
        const invoicesRes = await pool.query(
            `SELECT 
                COALESCE(SUM(total_amount), 0) as therapists_payout,
                COALESCE(SUM(center_amount), 0) as center_revenue,
                COALESCE(SUM(subtotal), 0) as total_revenue
             FROM invoice_submissions 
             WHERE year = $1 AND month = ANY($2::int[])`,
            [year, months]
        );

        const invoiceData = invoicesRes.rows[0];

        // B. Fetch Expenses (Outgoings)
        // Sum expenses in date range
        const expensesRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_expenses
             FROM expenses
             WHERE date >= $1 AND date <= $2`,
            [startDate, endDate]
        );

        const expensesTotal = parseFloat(expensesRes.rows[0].total_expenses);
        const centerRevenue = parseFloat(invoiceData.center_revenue);
        const netProfit = centerRevenue - expensesTotal;

        const liveData = {
            year: Number(year),
            quarter: Number(quarter),
            total_revenue: parseFloat(invoiceData.total_revenue),
            therapists_payout: parseFloat(invoiceData.therapists_payout),
            center_revenue: centerRevenue,
            expenses_total: expensesTotal,
            net_profit: netProfit,
            status: 'draft',
            is_preview: true
        };

        res.json({
            source: 'live',
            data: liveData
        });

    } catch (error) {
        console.error('Error getting quarterly report:', error);
        res.status(500).json({ message: 'Error getting quarterly report' });
    }
};

/**
 * Save Quarterly Report
 */
exports.saveQuarterlyReport = async (req, res) => {
    try {
        const { year, quarter, total_revenue, therapists_payout, center_revenue, expenses_total, net_profit, notes } = req.body;

        const result = await pool.query(
            `INSERT INTO quarterly_reports (
                year, quarter, total_revenue, therapists_payout, center_revenue, 
                expenses_total, net_profit, notes, status, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'closed', NOW())
            ON CONFLICT (year, quarter) 
            DO UPDATE SET 
                total_revenue = $3, 
                therapists_payout = $4,
                center_revenue = $5,
                expenses_total = $6,
                net_profit = $7,
                notes = $8,
                status = 'closed',
                updated_at = NOW()
            RETURNING *`,
            [year, quarter, total_revenue, therapists_payout, center_revenue, expenses_total, net_profit, notes]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error saving quarterly report:', error);
        res.status(500).json({ message: 'Error saving quarterly report' });
    }
};
