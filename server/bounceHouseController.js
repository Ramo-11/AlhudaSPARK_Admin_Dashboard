// bounceHouseController.js
const BounceHouseRegistration = require('../models/BounceHouseRegistration');
const logger = require('./logger');

exports.getAll = async (req, res) => {
    try {
        const data = await BounceHouseRegistration.find({}).sort('-createdAt');
        res.json({ success: true, data });
    } catch (e) {
        logger.error('Error fetching bounce house registrations:', e);
        res.json({ success: false, message: 'Fetch failed' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const total = await BounceHouseRegistration.countDocuments({});
        const active = await BounceHouseRegistration.countDocuments({ isActive: true });

        // Get total children count
        const registrations = await BounceHouseRegistration.find({});
        const totalChildren = registrations.reduce((sum, reg) => sum + reg.children.length, 0);

        // Gender breakdown
        let maleCount = 0;
        let femaleCount = 0;
        registrations.forEach((reg) => {
            reg.children.forEach((child) => {
                if (child.gender === 'male') maleCount++;
                else if (child.gender === 'female') femaleCount++;
            });
        });

        res.json({
            success: true,
            data: {
                total,
                active,
                totalChildren,
                maleCount,
                femaleCount,
            },
        });
    } catch (e) {
        logger.error('Error fetching bounce house stats:', e);
        res.json({ success: false, message: 'Stats fetch failed' });
    }
};

exports.update = async (req, res) => {
    try {
        const updateData = {
            notes: req.body.notes || '',
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        };

        const data = await BounceHouseRegistration.findOneAndUpdate(
            { registrationId: req.params.id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!data) {
            return res.json({ success: false, message: 'Registration not found' });
        }

        res.json({ success: true, data });
    } catch (e) {
        logger.error('Error updating bounce house registration:', e);
        res.json({ success: false, message: e.message || 'Update failed' });
    }
};

exports.remove = async (req, res) => {
    try {
        const result = await BounceHouseRegistration.findOneAndDelete({
            registrationId: req.params.id,
        });

        if (!result) {
            return res.json({ success: false, message: 'Registration not found' });
        }

        res.json({ success: true });
    } catch (e) {
        logger.error('Error deleting bounce house registration:', e);
        res.json({ success: false, message: 'Delete failed' });
    }
};
