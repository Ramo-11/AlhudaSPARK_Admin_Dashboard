// sponsorsController.js
const Sponsor = require("../models/Sponsor");
const { uploadImageToCloudinary } = require('./cloudinaryController');

exports.getAll = async (req,res)=>{
  try{ const data = await Sponsor.find({}).sort("-createdAt");
    res.json({success:true,data}); }catch(e){res.json({success:false,message:"Fetch failed"});}
};

exports.create = async (req,res)=>{
  try{
    const sponsorData = {
      ...req.body,
      sponsorId: Sponsor.generateSponsorId()
    };
    
    // Handle logo upload
    const logoFile = req.file;
    if (logoFile) {
      const companyName = req.body.companyName || 'sponsor';
      const sponsorId = sponsorData.sponsorId;
      
      const uploadResult = await uploadImageToCloudinary(logoFile.buffer, {
        folder: 'alhuda_spark/sponsors/',
        transformation: [
          { width: 400, height: 300, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });
      
      sponsorData.logo = uploadResult.secure_url;
    }
    
    const sponsor = new Sponsor(sponsorData);
    await sponsor.save();
    res.json({success:true,data:sponsor});
  }catch(e){
    res.json({success:false,message:e.message || "Create failed"});
  }
};

exports.update = async (req,res)=>{
  try{
    const updateData = {...req.body};
    
    // Handle logo upload
    const logoFile = req.file;
    if (logoFile) {
      const companyName = req.body.companyName || 'sponsor';
      
      const uploadResult = await uploadImageToCloudinary(logoFile.buffer, {
        folder: 'alhuda_spark/sponsors/',
        transformation: [
          { width: 400, height: 300, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });
      
      updateData.logo = uploadResult.secure_url;
    }
    
    const data = await Sponsor.findOneAndUpdate(
      {sponsorId:req.params.id},
      updateData,
      {new:true}
    );
    res.json({success:true,data});
  }catch(e){
    res.json({success:false,message:e.message || "Update failed"});
  }
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

exports.remove = async (req,res)=>{
  try{ await Sponsor.findOneAndDelete({sponsorId:req.params.id});
    res.json({success:true}); }catch(e){res.json({success:false,message:"Delete failed"});}
};
