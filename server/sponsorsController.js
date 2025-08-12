// sponsorsController.js
const Sponsor = require("../models/Sponsor");

exports.getAll = async (req,res)=>{
  try{ const data = await Sponsor.find({}).sort("-createdAt");
    res.json({success:true,data}); }catch(e){res.json({success:false,message:"Fetch failed"});}
};

exports.create = async (req,res)=>{
  try{
    const sponsor = new Sponsor({
      ...req.body,
      sponsorId: Sponsor.generateSponsorId()
    });
    await sponsor.save();
    res.json({success:true,data:sponsor});
  }catch(e){res.json({success:false,message:"Create failed"});}
};

exports.update = async (req,res)=>{
  try{
    const data = await Sponsor.findOneAndUpdate(
      {sponsorId:req.params.id},
      {...req.body},
      {new:true}
    );
    res.json({success:true,data});
  }catch(e){res.json({success:false,message:"Update failed"});}
};

exports.updatePayment = async (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;
    const updateData = { paymentStatus };
    
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    
    if (paymentStatus === 'completed') {
      updateData.paymentDate = new Date();
    }
    
    const data = await Sponsor.findOneAndUpdate(
      { sponsorId: req.params.id },
      updateData,
      { new: true }
    );
    
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: "Payment update failed" });
  }
};

exports.updateBenefits = async (req,res)=>{
  try{
    const data = await Sponsor.findOneAndUpdate(
      {sponsorId:req.params.id},
      {benefitsSent:!!req.body.benefitsSent, benefitsSentDate: new Date(), notes:req.body.notes||""},
      {new:true}
    );
    res.json({success:true,data});
  }catch(e){res.json({success:false,message:"Benefits update failed"});}
};

exports.remove = async (req,res)=>{
  try{ await Sponsor.findOneAndDelete({sponsorId:req.params.id});
    res.json({success:true}); }catch(e){res.json({success:false,message:"Delete failed"});}
};
