// internalFeedbackAdminController.js
const InternalFeedback = require('../models/InternalFeedback');
const logger = require('./logger');

exports.getAll = async (req, res) => {
    try {
        const data = await InternalFeedback.find({}).sort('-createdAt');
        res.json({ success: true, data });
    } catch (e) {
        logger.error('Error fetching internal feedback:', e);
        res.json({ success: false, message: 'Fetch failed' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const total = await InternalFeedback.countDocuments({});
        const feedbackList = await InternalFeedback.find({});

        // Calculate average ratings
        let totalRatings = {
            responsibilities: 0,
            communication: 0,
            execution: 0,
            problemHandling: 0,
            resources: 0,
            website: 0,
            coordination: 0,
            overall: 0,
        };

        let ratingCounts = {
            responsibilities: 0,
            communication: 0,
            execution: 0,
            problemHandling: 0,
            resources: 0,
            website: 0,
            coordination: 0,
            overall: 0,
        };

        let volunteerAgainCount = 0;
        let helpPlanCount = 0;

        feedbackList.forEach((fb) => {
            Object.keys(totalRatings).forEach((key) => {
                if (fb.ratings[key] !== undefined && fb.ratings[key] !== null) {
                    totalRatings[key] += fb.ratings[key];
                    ratingCounts[key]++;
                }
            });

            if (fb.volunteerAgain === true) volunteerAgainCount++;
            if (fb.helpPlan === true) helpPlanCount++;
        });

        const averages = {};
        Object.keys(totalRatings).forEach((key) => {
            averages[key] =
                ratingCounts[key] > 0 ? (totalRatings[key] / ratingCounts[key]).toFixed(2) : '0.00';
        });

        const allRatingValues = Object.values(totalRatings).reduce((a, b) => a + b, 0);
        const allRatingCounts = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
        const overallAvg =
            allRatingCounts > 0 ? (allRatingValues / allRatingCounts).toFixed(2) : '0.00';

        res.json({
            success: true,
            data: {
                total,
                averages,
                overallAvg,
                volunteerAgainCount,
                helpPlanCount,
                ratingCounts,
            },
        });
    } catch (e) {
        logger.error('Error fetching internal feedback stats:', e);
        res.json({ success: false, message: 'Stats fetch failed' });
    }
};

exports.update = async (req, res) => {
    try {
        const updateData = {
            notes: req.body.notes || '',
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        };

        const data = await InternalFeedback.findOneAndUpdate(
            { feedbackId: req.params.id },
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!data) {
            return res.json({ success: false, message: 'Feedback not found' });
        }

        res.json({ success: true, data });
    } catch (e) {
        logger.error('Error updating internal feedback:', e);
        res.json({ success: false, message: e.message || 'Update failed' });
    }
};

exports.remove = async (req, res) => {
    try {
        const result = await InternalFeedback.findOneAndDelete({ feedbackId: req.params.id });

        if (!result) {
            return res.json({ success: false, message: 'Feedback not found' });
        }

        res.json({ success: true });
    } catch (e) {
        logger.error('Error deleting internal feedback:', e);
        res.json({ success: false, message: 'Delete failed' });
    }
};
