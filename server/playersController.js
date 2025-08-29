// playersController.js
const Player = require("../models/Player");
const logger = require("./logger");

exports.getAll = async (req, res) => {
    try {
        const data = await Player.find({}).sort("-createdAt");
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: "Fetch failed" });
    }
};

exports.getStats = async (req, res) => {
    try {
        const [total, approved] = await Promise.all([
            Player.countDocuments({}),
            Player.countDocuments({ registrationStatus: "approved" })
        ]);
        
        const revenue = await Player.aggregate([
            { $match: { paymentStatus: "completed" } },
            { $group: { _id: null, sum: { $sum: "$registrationFee" } } }
        ]);
        
        const pendingPayments = await Player.countDocuments({ paymentStatus: "pending" });
        
        // Count shirts for approved players only
        const shirtCount = await Player.countDocuments({ 
            registrationStatus: "approved",
            shirtSize: { $exists: true, $ne: "" }
        });
        
        res.json({
            success: true,
            data: {
                total,
                approved,
                revenue: revenue[0]?.sum || 0,
                pendingPayments,
                shirtCount
            }
        });
    } catch (e) {
        res.json({ success: false, message: "Stats fetch failed" });
    }
};

exports.create = async (req, res) => {
    try {
        const player = new Player({
            playerName: req.body.playerName,
            dateOfBirth: req.body.dateOfBirth,
            shirtSize: req.body.shirtSize?.toUpperCase(),
            currentSchool: req.body.currentSchool,
            chosenTeam: req.body.chosenTeam,
            parentInfo: {
                name: req.body.parentInfo?.name,
                email: req.body.parentInfo?.email,
                phone: req.body.parentInfo?.phone
            },
            comments: req.body.comments,
            registrationFee: req.body.registrationFee || 200,
            paymentMethod: req.body.paymentMethod || 'pending',
            paymentStatus: 'pending',
            waiverAccepted: req.body.waiverAccepted || false,
            waiverAcceptedDate: req.body.waiverAccepted ? new Date() : null,
            playerId: Player.generatePlayerId(),
            ageAtRegistration: 0 // Will be calculated by the model
        });
        
        // Calculate age
        player.calculateAge();
        
        await player.save();
        res.json({ success: true, data: player });
    } catch (e) {
        res.json({ success: false, message: e.message || "Create failed" });
    }
};

exports.update = async (req, res) => {
    try {
        const updateData = {
            playerName: req.body.playerName,
            dateOfBirth: req.body.dateOfBirth,
            shirtSize: req.body.shirtSize?.toUpperCase(),
            currentSchool: req.body.currentSchool,
            chosenTeam: req.body.chosenTeam,
            parentInfo: {
                name: req.body.parentInfo?.name,
                email: req.body.parentInfo?.email,
                phone: req.body.parentInfo?.phone
            },
            comments: req.body.comments,
            waiverAccepted: req.body.waiverAccepted || false,
            waiverAcceptedDate: req.body.waiverAccepted ? new Date() : null
        };
        
        const data = await Player.findOneAndUpdate(
            { playerId: req.params.id },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!data) {
            return res.json({ success: false, message: "Player not found" });
        }
        
        // Recalculate age if DOB changed
        if (req.body.dateOfBirth) {
            data.calculateAge();
            await data.save();
        }
        
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: e.message || "Update failed" });
    }
};

exports.updatePayment = async (req, res) => {
    try {
        const updateData = {
            paymentStatus: req.body.paymentStatus,
            paymentMethod: req.body.paymentMethod,
            transactionId: req.body.transactionId
        };
        
        // If payment is completed, also update registration status and add payment date
        if (req.body.paymentStatus === 'completed') {
            updateData.registrationStatus = 'approved';
            updateData.paymentDate = req.body.paymentDate || new Date();
        }
        
        const data = await Player.findOneAndUpdate(
            { playerId: req.params.id },
            updateData,
            { new: true }
        );
        
        if (!data) {
            return res.json({ success: false, message: "Player not found" });
        }
        
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: e.message || "Payment update failed" });
    }
};

exports.remove = async (req, res) => {
    try {
        const result = await Player.findOneAndDelete({ playerId: req.params.id });
        
        if (!result) {
            return res.json({ success: false, message: "Player not found" });
        }
        
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: "Delete failed" });
    }
};

// Export for shirt orders
exports.getShirtSummary = async (req, res) => {
    try {
        const approvedPlayers = await Player.find({ 
            registrationStatus: "approved",
            shirtSize: { $exists: true, $ne: "" }
        }).select('shirtSize');
        
        const summary = {};
        approvedPlayers.forEach(player => {
            summary[player.shirtSize] = (summary[player.shirtSize] || 0) + 1;
        });
        
        res.json({ success: true, data: summary });
    } catch (e) {
        res.json({ success: false, message: "Failed to get shirt summary" });
    }
};