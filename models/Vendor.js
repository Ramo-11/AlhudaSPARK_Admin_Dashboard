// Vendor Model for MongoDB
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    // Unique vendor ID
    vendorId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Business Information
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
    
    // Vendor Category
    vendorType: {
        type: String,
        required: true,
        enum: ['food', 'clothing', 'accessories', 'books', 'crafts', 'services', 'other'],
        lowercase: true
    },
    
    // Business Description
    businessDescription: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    
    // Booth Selection
    booths: [{
        boothId: {
            type: String,
            required: true
        },
        boothType: {
            type: String,
            enum: ['premium', 'standard'],
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    
    totalBoothPrice: {
        type: Number,
        required: true
    },
    
    // Payment Information
    paymentMethod: {
        type: String,
        required: true,
        enum: ['zelle', 'stripe']
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected'],
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
    
    discountApplied: {
        type: Number,
        default: null
    },
    originalPrice: {
        type: Number,
        default: null
    },
    // Terms Acceptance
    acceptedTerms: {
        type: Boolean,
        required: true,
        default: false
    },
    acceptedTermsDate: {
        type: Date,
        default: null
    },
    
    // Additional Information
    comments: {
        type: String,
        default: ''
    },
    
    // Admin fields
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
vendorSchema.index({ vendorType: 1, paymentStatus: 1 });
vendorSchema.index({ 'booths.boothId': 1 });
vendorSchema.index({ createdAt: -1 });

// Static method to generate unique vendor ID
vendorSchema.statics.generateVendorId = function() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `VND-${timestamp}-${randomStr}`.toUpperCase();
};

// Static method to calculate booth pricing
vendorSchema.statics.calculateBoothPrice = function(boothType, quantity) {
    const pricing = {
        premium: { 1: 600, 2: 1100, 3: 1500 },
        standard: { 1: 350, 2: 750, 3: 1000 }
    };
    
    return pricing[boothType]?.[quantity] || 0;
};

// Instance method to mark payment as complete
vendorSchema.methods.markPaymentComplete = function(transactionId) {
    this.paymentStatus = 'completed';
    this.transactionId = transactionId;
    this.paymentDate = new Date();
    return this.save();
};

// Virtual for booth count
vendorSchema.virtual('boothCount').get(function() {
    return this.booths.length;
});

// Transform for JSON output
vendorSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;