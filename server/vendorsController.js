// vendorsController.js
const Vendor = require("../models/Vendor");

exports.getAll = async (req,res)=>{
  try{ const data = await Vendor.find({}).sort("-createdAt");
    res.json({success:true,data}); }catch(e){res.json({success:false,message:"Fetch failed"});}
};

exports.create = async (req,res)=>{
  try{
    const boothPrices = Vendor.getBoothPricing();
    const vendor = new Vendor({
      ...req.body,
      vendorId: Vendor.generateVendorId(),
      boothPrice: boothPrices[req.body.boothLocation] || req.body.boothPrice || 0
    });
    await vendor.save();
    res.json({success:true,data:vendor});
  }catch(e){res.json({success:false,message:"Create failed"});}
};

exports.update = async (req,res)=>{
  try{
    const data = await Vendor.findOneAndUpdate(
      {vendorId:req.params.id},
      {...req.body},
      {new:true}
    );
    res.json({success:true,data});
  }catch(e){res.json({success:false,message:"Update failed"});}
};

exports.remove = async (req,res)=>{
  try{ await Vendor.findOneAndDelete({vendorId:req.params.id});
    res.json({success:true}); }catch(e){res.json({success:false,message:"Delete failed"});}
};
