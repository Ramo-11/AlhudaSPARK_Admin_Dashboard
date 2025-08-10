// teamsController.js
const Team = require("../models/Team");

exports.getAll = async (req,res)=>{
  try{ const data = await Team.find({}).sort("-createdAt");
    res.json({success:true,data}); }catch(e){res.json({success:false,message:"Fetch failed"});}
};

exports.create = async (req,res)=>{
  try{
    const fees = Team.getRegistrationFees();
    const team = new Team({
      ...req.body,
      teamId: Team.generateTeamId(),
      registrationFee: fees[req.body.tier] || req.body.registrationFee || 0
    });
    await team.save();
    res.json({success:true,data:team});
  }catch(e){res.json({success:false,message:e.message||"Create failed"});}
};

exports.update = async (req,res)=>{
  try{
    const data = await Team.findOneAndUpdate(
      {teamId:req.params.id},
      {...req.body},
      {new:true, runValidators:true}
    );
    res.json({success:true,data});
  }catch(e){res.json({success:false,message:e.message||"Update failed"});}
};

exports.updateStatus = async (req,res)=>{
  try{
    const data = await Team.findOneAndUpdate(
      {teamId:req.params.id},
      {registrationStatus:req.body.registrationStatus, notes:req.body.notes||""},
      {new:true}
    );
    res.json({success:true,data});
  }catch(e){res.json({success:false,message:"Status update failed"});}
};

exports.remove = async (req,res)=>{
  try{ await Team.findOneAndDelete({teamId:req.params.id});
    res.json({success:true}); }catch(e){res.json({success:false,message:"Delete failed"});}
};
