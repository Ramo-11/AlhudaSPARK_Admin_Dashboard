// router.js
const express = require("express");
const route = express.Router();
const Vendor = require("../models/Vendor");
const Team = require("../models/Team");
const Sponsor = require("../models/Sponsor");
const vendors = require("./vendorsController");
const teams = require("./teamsController");
const sponsors = require("./sponsorsController");

// Pages
route.get("/", (req,res)=>res.render("dashboard"));
route.get("/vendors", (req,res)=>res.render("vendors"));
route.get("/teams", (req,res)=>res.render("teams"));
route.get("/sponsors", (req,res)=>res.render("sponsors"));

// Dashboard API
route.get("/api/dashboard/stats", async (req,res)=>{
  try{
    const [vTotal,vActive] = await Promise.all([
      Vendor.countDocuments({}), Vendor.countDocuments({isActive:true})
    ]);
    const [tTotal,tApproved] = await Promise.all([
      Team.countDocuments({}), Team.countDocuments({registrationStatus:"approved"})
    ]);
    const [sTotal,sActive] = await Promise.all([
      Sponsor.countDocuments({}), Sponsor.countDocuments({isActive:true})
    ]);
    const vendRev = await Vendor.aggregate([{ $match:{paymentStatus:"completed"} },{ $group:{_id:0,sum:{$sum:"$boothPrice"}} }]);
    const teamRev = await Team.aggregate([{ $match:{paymentStatus:"completed"} },{ $group:{_id:0,sum:{$sum:"$registrationFee"}} }]);
    const sponRev = await Sponsor.aggregate([{ $match:{paymentStatus:"completed"} },{ $group:{_id:0,sum:{$sum:"$amount"}} }]);
    const pending = await Promise.all([
      Vendor.countDocuments({paymentStatus:"pending"}),
      Team.countDocuments({paymentStatus:"pending"}),
      Sponsor.countDocuments({paymentStatus:"pending"})
    ]);
    res.json({success:true,data:{
      vendors:{total:vTotal,active:vActive},
      teams:{total:tTotal,approved:tApproved},
      sponsors:{total:sTotal,active:sActive},
      revenue:{total:(vendRev[0]?.sum||0)+(teamRev[0]?.sum||0)+(sponRev[0]?.sum||0),pending: pending.reduce((a,b)=>a+b,0)}
    }});
  }catch(e){res.json({success:false,message:"Stats error"});}
});

route.get("/api/dashboard/activity", async (req,res)=>{
  try{
    const limit=10;
    const map = (doc,type,title)=>doc && ({type,title, timestamp:doc.createdAt});
    const [v,t,s]=await Promise.all([
      Vendor.find({}).sort("-createdAt").limit(limit),
      Team.find({}).sort("-createdAt").limit(limit),
      Sponsor.find({}).sort("-createdAt").limit(limit)
    ]);
    const items=[
      ...v.map(x=>map(x,"vendor",`Vendor: ${x.businessName}`)),
      ...t.map(x=>map(x,"team",`Team: ${x.teamName}`)),
      ...s.map(x=>map(x,"sponsor",`Sponsor: ${x.companyName}`))
    ].filter(Boolean).sort((a,b)=>b.timestamp-a.timestamp).slice(0,limit);
    res.json({success:true,data:items});
  }catch(e){res.json({success:false,message:"Activity error"});}
});

// Vendors
route.get("/api/vendors", vendors.getAll);
route.post("/api/vendors", vendors.create);
route.put("/api/vendors/:id", vendors.update);
route.delete("/api/vendors/:id", vendors.remove);

// Teams
route.get("/api/teams", teams.getAll);
route.post("/api/teams", teams.create);
route.put("/api/teams/:id", teams.update);
route.patch("/api/teams/:id/status", teams.updateStatus);
route.delete("/api/teams/:id", teams.remove);

// Sponsors
route.get("/api/sponsors", sponsors.getAll);
route.post("/api/sponsors", sponsors.create);
route.put("/api/sponsors/:id", sponsors.update);
route.patch("/api/sponsors/:id/benefits", sponsors.updateBenefits);
route.delete("/api/sponsors/:id", sponsors.remove);

module.exports = route;
