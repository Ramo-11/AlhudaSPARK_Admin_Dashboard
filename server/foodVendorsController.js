// foodVendorsController.js - Admin controller for food vendors
const FoodVendor = require("../models/FoodVendor");

exports.getAll = async (req, res) => {
    try {
        const data = await FoodVendor.find({}).sort("-createdAt");
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: "Fetch failed" });
    }
};

// No create function since we don't want to create from admin

exports.update = async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        const data = await FoodVendor.findOneAndUpdate(
            { vendorId: req.params.id },
            updateData,
            { new: true }
        );
        
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: e.message || "Update failed" });
    }
};

exports.remove = async (req, res) => {
    try {
        await FoodVendor.findOneAndDelete({ vendorId: req.params.id });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: "Delete failed" });
    }
};

exports.updatePayment = async (req, res) => {
    try {
        const updateData = {
            paymentStatus: req.body.paymentStatus
        };
        
        if (req.body.transactionId) {
            updateData.transactionId = req.body.transactionId;
        }
        
        if (req.body.paymentStatus === 'completed') {
            updateData.paymentDate = new Date();
        }
        
        const data = await FoodVendor.findOneAndUpdate(
            { vendorId: req.params.id },
            updateData,
            { new: true }
        );
        
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: "Payment update failed" });
    }
};