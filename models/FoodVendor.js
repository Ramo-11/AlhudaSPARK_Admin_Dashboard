// Food Vendor Model for MongoDB
const mongoose = require('mongoose');

const foodVendorSchema = new mongoose.Schema({
    vendorId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    website: {
        type: String,
        trim: true,
        default: ''
    },
    
    menuDescription: {
        type: String,
        trim: true,
        maxlength: 500
    },
    
    vendorFee: {
        type: Number,
        required: true,
        default: 3000
    },
    
    paymentMethod: {
        type: String,
        required: true,
        enum: ['zelle', 'stripe']
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        default: null
    },
    paymentDate: {
        type: Date,
        default: null
    },

    specialRequirements: {
        type: String,
        default: '',
        maxlength: 300
    },
    
    acceptedTerms: {
        type: Boolean,
        required: true,
        default: false
    },
    acceptedTermsDate: {
        type: Date,
        default: null
    },
    
    comments: {
        type: String,
        default: ''
    },
    
    notes: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
foodVendorSchema.index({ paymentStatus: 1 });
foodVendorSchema.index({ createdAt: -1 });

// Static method to generate unique vendor ID
foodVendorSchema.statics.generateVendorId = function() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `FVD-${timestamp}-${randomStr}`.toUpperCase();
};

// Instance method to mark payment as complete
foodVendorSchema.methods.markPaymentComplete = function(transactionId) {
    this.paymentStatus = 'completed';
    this.transactionId = transactionId;
    this.paymentDate = new Date();
    return this.save();
};

// Transform for JSON output
foodVendorSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const FoodVendor = mongoose.model('FoodVendor', foodVendorSchema);

module.exports = FoodVendor;