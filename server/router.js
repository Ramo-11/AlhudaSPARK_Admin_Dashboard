// router.js
const express = require("express");
const route = express.Router();
const Vendor = require("../models/Vendor");
const Team = require("../models/Team");
const Sponsor = require("../models/Sponsor");
const Player = require("../models/Player");
const vendors = require("./vendorsController");
const teams = require("./teamsController");
const sponsors = require("./sponsorsController");
const players = require("./playersController");
const FoodVendor = require("../models/FoodVendor");
const foodVendors = require("./foodVendorsController");

const { 
    upload, 
    handleImageUpload, 
    handleMultipleImageUpload, 
    handleImageDeletion, 
    handleMulterError 
} = require("./cloudinaryController")

// Pages
route.get("/", (req,res)=>res.render("dashboard"));
route.get("/vendors", (req,res)=>res.render("vendors"));
route.get("/food-vendors", (req, res) => res.render("food-vendors"));
route.get("/teams", (req,res)=>res.render("teams"));
route.get("/sponsors", (req,res)=>res.render("sponsors"));
route.get("/players", (req,res)=>res.render("players"));

// Dashboard API
route.get("/api/dashboard/stats", async (req, res) => {
    try {
        const [vTotal, vActive] = await Promise.all([
            Vendor.countDocuments({}), 
            Vendor.countDocuments({ isActive: true })
        ]);
        
        const [fvTotal, fvActive] = await Promise.all([
            FoodVendor.countDocuments({}), 
            FoodVendor.countDocuments({ paymentStatus: "completed" })
        ]);
        
        const [tTotal, tApproved] = await Promise.all([
            Team.countDocuments({}), 
            Team.countDocuments({ registrationStatus: "approved" })
        ]);
        
        const [sTotal, sActive] = await Promise.all([
            Sponsor.countDocuments({}), 
            Sponsor.countDocuments({ isActive: true })
        ]);
        
        const [pTotal, pApproved] = await Promise.all([
            Player.countDocuments({}),
            Player.countDocuments({ registrationStatus: "approved" })
        ]);
        
        const vendRev = await Vendor.aggregate([
            { $match: { paymentStatus: "completed" } },
            { $group: { _id: 0, sum: { $sum: "$totalBoothPrice" } } }
        ]);
        
        const foodVendRev = await FoodVendor.aggregate([
            { $match: { paymentStatus: "completed" } },
            { $group: { _id: 0, sum: { $sum: "$vendorFee" } } }
        ]);
        
        const teamRev = await Team.aggregate([
            { $match: { paymentStatus: "completed" } },
            { $group: { _id: 0, sum: { $sum: "$registrationFee" } } }
        ]);
        
        const sponRev = await Sponsor.aggregate([
            { $match: { paymentStatus: "completed" } },
            { $group: { _id: 0, sum: { $sum: "$amount" } } }
        ]);
        
        const practiceRev = await Player.aggregate([
            { $match: { paymentStatus: "completed" } },
            { $group: { _id: null, sum: { $sum: "$registrationFee" } } }
        ]);
        
        const pending = await Promise.all([
            Vendor.countDocuments({ paymentStatus: "pending" }),
            FoodVendor.countDocuments({ paymentStatus: "pending" }),
            Team.countDocuments({ paymentStatus: "pending" }),
            Sponsor.countDocuments({ paymentStatus: "pending" }),
            Player.countDocuments({ paymentStatus: "pending" })
        ]);
        
        res.json({
            success: true,
            data: {
                vendors: { total: vTotal, active: vActive },
                foodVendors: { total: fvTotal, active: fvActive },
                teams: { total: tTotal, approved: tApproved },
                sponsors: { total: sTotal, active: sActive },
                players: { total: pTotal, approved: pApproved },
                practiceRevenue: practiceRev[0]?.sum || 0,
                revenue: {
                    total: (vendRev[0]?.sum || 0) + 
                           (foodVendRev[0]?.sum || 0) + 
                           (teamRev[0]?.sum || 0) + 
                           (sponRev[0]?.sum || 0) + 
                           (practiceRev[0]?.sum || 0),
                    pending: pending.reduce((a, b) => a + b, 0)
                },
            }
        });
    } catch (e) {
        res.json({ success: false, message: "Stats error" });
    }
});

route.get("/api/dashboard/activity", async (req, res) => {
    try {
        const limit = 10;
        const map = (doc, type, title) => doc && ({ type, title, timestamp: doc.createdAt });
        
        const [v, fv, t, s] = await Promise.all([
            Vendor.find({}).sort("-createdAt").limit(limit),
            FoodVendor.find({}).sort("-createdAt").limit(limit),
            Team.find({}).sort("-createdAt").limit(limit),
            Sponsor.find({}).sort("-createdAt").limit(limit)
        ]);
        
        const items = [
            ...v.map(x => map(x, "vendor", `Vendor: ${x.businessName}`)),
            ...fv.map(x => map(x, "food-vendor", `Food Vendor: ${x.businessName}`)),
            ...t.map(x => map(x, "team", `Team: ${x.teamName}`)),
            ...s.map(x => map(x, "sponsor", `Sponsor: ${x.companyName}`))
        ].filter(Boolean).sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
        
        res.json({ success: true, data: items });
    } catch (e) {
        res.json({ success: false, message: "Activity error" });
    }
});

// Vendors
route.get("/api/vendors", vendors.getAll);
route.post("/api/vendors", upload.single('logo'), vendors.create);
route.put("/api/vendors/:id", upload.single('logo'), vendors.update);
route.delete("/api/vendors/:id", vendors.remove);
route.patch("/api/vendors/:id/payment", vendors.updatePayment);

// Food Vendors API routes
route.get("/api/food-vendors", foodVendors.getAll);
route.put("/api/food-vendors/:id", foodVendors.update);
route.delete("/api/food-vendors/:id", foodVendors.remove);
route.patch("/api/food-vendors/:id/payment", foodVendors.updatePayment);

// Teams
route.get("/api/teams", teams.getAll);
route.post("/api/teams", upload.any(), teams.create, handleMulterError);
route.put("/api/teams/:id", upload.any(), teams.update, handleMulterError);
route.patch("/api/teams/:id/status", teams.updateStatus);
route.patch("/api/teams/:id/payment", teams.updatePayment);
route.delete("/api/teams/:id", teams.remove);

// Sponsors
route.get("/api/sponsors", sponsors.getAll);
route.post('/api/sponsors', upload.single('logo'), sponsors.create);
route.put('/api/sponsors/:id', upload.single('logo'), sponsors.update);
route.delete("/api/sponsors/:id", sponsors.remove);
route.patch("/api/sponsors/:id/payment", sponsors.updatePayment);

// Players
route.get("/api/players", players.getAll);
route.get("/api/players/stats", players.getStats);
route.get("/api/players/shirts", players.getShirtSummary);
route.post("/api/players", players.create);
route.put("/api/players/:id", players.update);
route.patch("/api/players/:id/payment", players.updatePayment);
route.delete("/api/players/:id", players.remove);

module.exports = route;
