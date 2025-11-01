// feedbackAdminController.js
const Feedback = require('../models/Feedback');
const logger = require('./logger');

exports.getAll = async (req, res) => {
    try {
        const data = await Feedback.find({}).sort('-createdAt');
        res.json({ success: true, data });
    } catch (e) {
        logger.error('Error fetching feedback:', e);
        res.json({ success: false, message: 'Fetch failed' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const total = await Feedback.countDocuments({});
        const feedbackList = await Feedback.find({});

        // Calculate average ratings
        let totalRatings = {
            organization: 0,
            communication: 0,
            volunteers: 0,
            cleanliness: 0,
            foodQuality: 0,
            pricing: 0,
            checkin: 0,
            tournamentManagement: 0,
            quranManagement: 0,
            schedule: 0,
            seating: 0,
            overall: 0,
        };

        feedbackList.forEach((fb) => {
            Object.keys(totalRatings).forEach((key) => {
                totalRatings[key] += fb.ratings[key];
            });
        });

        const averages = {};
        Object.keys(totalRatings).forEach((key) => {
            averages[key] = total > 0 ? (totalRatings[key] / total).toFixed(2) : 0;
        });

        // Calculate overall average
        const overallAvg =
            total > 0
                ? (Object.values(totalRatings).reduce((a, b) => a + b, 0) / (total * 12)).toFixed(2)
                : 0;

        res.json({
            success: true,
            data: {
                total,
                averages,
                overallAvg,
            },
        });
    } catch (e) {
        logger.error('Error fetching feedback stats:', e);
        res.json({ success: false, message: 'Stats fetch failed' });
    }
};

exports.update = async (req, res) => {
    try {
        const updateData = {
            notes: req.body.notes || '',
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        };

        const data = await Feedback.findOneAndUpdate({ feedbackId: req.params.id }, updateData, {
            new: true,
            runValidators: true,
        });

        if (!data) {
            return res.json({ success: false, message: 'Feedback not found' });
        }

        res.json({ success: true, data });
    } catch (e) {
        logger.error('Error updating feedback:', e);
        res.json({ success: false, message: e.message || 'Update failed' });
    }
};

exports.remove = async (req, res) => {
    try {
        const result = await Feedback.findOneAndDelete({ feedbackId: req.params.id });

        if (!result) {
            return res.json({ success: false, message: 'Feedback not found' });
        }

        res.json({ success: true });
    } catch (e) {
        logger.error('Error deleting feedback:', e);
        res.json({ success: false, message: 'Delete failed' });
    }
};
