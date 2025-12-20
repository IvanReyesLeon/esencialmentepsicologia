const { getAggregatedHours } = require('../services/calendarService');
const { getAllTherapists } = require('../models/therapistQueries');

/**
 * Get hours for all therapists (Admin view)
 */
exports.getAdminBilling = async (req, res) => {
    try {
        const { calendarId } = req.params; // Or from a config/env
        // We will force the calendarId for now if not sent, or use the one from config
        // Actually, user hasn't provided the calendar ID in code yet, I should probably put it in .env
        // For now I'll expect it in query or body, or hardcode/env it. 
        // User provided it in chat, I should have asked them to put it in .env strictly, 
        // but I can also accept it from the frontend request which has the configuration.
        // Let's assume frontend sends it for flexibility, or we store it in DB.

        // BETTER: Allow passing it, but default to a known one if we save it.
        // Since I don't have it saved, I'll rely on the frontend sending it.
        const targetCalendarId = req.query.calendarId;

        if (!targetCalendarId) {
            return res.status(400).json({ message: 'Calendar ID required' });
        }

        const [billingData, therapists] = await Promise.all([
            getAggregatedHours(targetCalendarId),
            getAllTherapists()
        ]);

        // Map colors to therapists
        // billingData.totals = { "1": 5, "4": 10 }
        // therapists = [ { id: 1, full_name: 'Teresa', calendar_color_id: '1' }, ... ]

        const report = therapists.map(t => {
            const hours = billingData.totals[t.calendar_color_id] || 0;
            return {
                therapistId: t.id,
                name: t.full_name,
                colorId: t.calendar_color_id,
                hours,
                total: hours // Can be multiplied by rate if we had it
            };
        }).filter(item => item.colorId); // Only show linked therapists? Or show all with 0?
        // Show all is better so they see who is missing configuration.

        res.json({
            period: billingData.period,
            report,
            rawTotals: billingData.totals // For debugging/unmapped colors
        });

    } catch (error) {
        console.error('Billing error:', error);
        res.status(500).json({ message: 'Error calculating billing' });
    }
};

/**
 * Get hours for the logged-in therapist
 */
exports.getTherapistBilling = async (req, res) => {
    try {
        const { therapist_id } = req.user;
        const targetCalendarId = req.query.calendarId;

        if (!therapist_id) {
            return res.status(400).json({ message: 'User is not linked to a therapist profile' });
        }

        if (!targetCalendarId) {
            return res.status(400).json({ message: 'Calendar ID required' });
        }

        // Get all data first (API doesn't filter by color, we filter here)
        const billingData = await getAggregatedHours(targetCalendarId);
        const therapists = await getAllTherapists();
        const me = therapists.find(t => t.id === therapist_id);

        if (!me || !me.calendar_color_id) {
            return res.json({
                period: billingData.period,
                hours: 0,
                message: 'Profile not linked to a calendar color'
            });
        }

        const myHours = billingData.totals[me.calendar_color_id] || 0;

        res.json({
            period: billingData.period,
            therapist: me.full_name,
            hours: myHours
        });

    } catch (error) {
        console.error('My Billing error:', error);
        res.status(500).json({ message: 'Error calculating your billing' });
    }
};
