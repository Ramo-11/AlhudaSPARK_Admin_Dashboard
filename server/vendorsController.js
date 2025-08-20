// vendorsController.js
const Vendor = require("../models/Vendor");
const { uploadImageToCloudinary } = require('./cloudinaryController');

exports.getAll = async (req,res)=>{
  try{ const data = await Vendor.find({}).sort("-createdAt");
    res.json({success:true,data}); }catch(e){res.json({success:false,message:"Fetch failed"});}
};

exports.create = async (req, res) => {
  try {
    const vendorData = {
      ...req.body,
      vendorId: Vendor.generateVendorId()
    };
    
    // Handle booth selection and pricing
    if (req.body.booths) {
      const selectedBooths = Array.isArray(req.body.booths) ? req.body.booths : [req.body.booths];
      const booths = [];
      let totalPrice = 0;
      
      selectedBooths.forEach(boothId => {
        const boothType = boothId.startsWith('P') ? 'premium' : 'standard';
        const price = boothType === 'premium' ? 1000 : 500;
        
        booths.push({
          boothId: boothId,
          boothType: boothType,
          price: price
        });
        
        totalPrice += price;
      });
      
      vendorData.booths = booths;
      vendorData.totalBoothPrice = totalPrice;
    }
    
    // Handle logo upload
    const logoFile = req.file;
    if (logoFile) {
      const businessName = req.body.businessName || 'vendor';
      const vendorId = vendorData.vendorId;
      
      const uploadResult = await uploadImageToCloudinary(logoFile.buffer, {
        folder: 'alhuda_spark/vendors/',
        transformation: [
          { width: 400, height: 300, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });
      
      vendorData.logo = uploadResult.secure_url;
    }
    
    const vendor = new Vendor(vendorData);
    await vendor.save();
    res.json({success: true, data: vendor});
  } catch (e) {
    res.json({success: false, message: e.message || "Create failed"});
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = {...req.body};
    
    // Handle booth selection and pricing if booths are being updated
    if (req.body.booths) {
      const selectedBooths = Array.isArray(req.body.booths) ? req.body.booths : [req.body.booths];
      const booths = [];
      let totalPrice = 0;
      
      selectedBooths.forEach(boothId => {
        const boothType = boothId.startsWith('P') ? 'premium' : 'standard';
        const price = boothType === 'premium' ? 1000 : 500;
        
        booths.push({
          boothId: boothId,
          boothType: boothType,
          price: price
        });
        
        totalPrice += price;
      });
      
      updateData.booths = booths;
      updateData.totalBoothPrice = totalPrice;
    }
    
    // Handle logo upload
    const logoFile = req.file;
    if (logoFile) {
      const businessName = req.body.businessName || 'vendor';
      
      const uploadResult = await uploadImageToCloudinary(logoFile.buffer, {
        folder: 'alhuda_spark/vendors/',
        transformation: [
          { width: 400, height: 300, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });
      
      updateData.logo = uploadResult.secure_url;
    }
    
    const data = await Vendor.findOneAndUpdate(
      {vendorId: req.params.id},
      updateData,
      {new: true}
    );
    res.json({success: true, data});
  } catch (e) {
    res.json({success: false, message: e.message || "Update failed"});
  }
};

exports.remove = async (req,res)=>{
  try{ await Vendor.findOneAndDelete({vendorId:req.params.id});
    res.json({success:true}); }catch(e){res.json({success:false,message:"Delete failed"});}
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
        
        const data = await Vendor.findOneAndUpdate(
            { vendorId: req.params.id },
            updateData,
            { new: true }
        );
        
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: "Payment update failed" });
    }
};