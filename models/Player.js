// Player Model for Practice Session Registration
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    // Unique player ID
    playerId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Player Information
    playerName: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    shirtSize: {
        type: String,
        required: true,
        enum: ['YS', 'YM', 'YL', 'YXL', 'AS', 'AM', 'AL', 'AXL'],
        uppercase: true
    },
    chosenTeam: {
        type: String,
        enum: ['HS Boys White', 'HS Boys Black', 'HS Boys Gold', 'MS Boys White', 
            'MS Boys Black', 'MS Boys Gold', 'MS Boys Red', 'MS Boys Blue', 'MS Girls White', 
            'MS Girls Black', 'MS Girls Gold', '4th/5th Boys White', '4th/5th Boys Black', '4th/5th Girls White', 
            '4th/5th Girls Black', '4th/5th Girls Gold', 'K/1st (Mixed)', '2nd/3rd Girls', '2nd/3rd Boys'],
        required: true
    },
    currentSchool: {
        type: String,
        required: true,
        trim: true
    },
    
    // Parent/Guardian Information
    parentInfo: {
        name: {
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
        }
    },
    
    // Additional Information
    comments: {
        type: String,
        default: '',
        maxlength: 500
    },
    
    // Registration Fee
    registrationFee: {
        type: Number,
        required: true,
        default: 200
    },
    
    // Payment Information
    paymentMethod: {
        type: String,
        enum: ['check', 'cash', 'zelle', 'venmo', 'stripe'],
        required: true
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
    
    // Waiver Acceptance
    waiverAccepted: {
        type: Boolean,
        required: true,
        default: false
    },
    waiverAcceptedDate: {
        type: Date,
        default: null
    },
    
    // Registration Status
    registrationStatus: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'cancelled'],
        default: 'pending'
    },
    
    // Admin fields
    notes: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Calculate age at registration
    ageAtRegistration: {
        type: Number,
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for better query performance
playerSchema.index({ parentInfo: 1 });
playerSchema.index({ createdAt: -1 });
playerSchema.index({ paymentStatus: 1, registrationStatus: 1 });

// Static method to generate unique player ID
playerSchema.statics.generatePlayerId = function() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `PL-${timestamp}-${randomStr}`.toUpperCase();
};

// Instance method to calculate player age
playerSchema.methods.calculateAge = function() {
    const currentDate = new Date();
    const birthDate = new Date(this.dateOfBirth);
    const age = Math.floor((currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    this.ageAtRegistration = age;
    return age;
};

// Instance method to mark payment as complete
playerSchema.methods.markPaymentComplete = function(transactionId) {
    this.paymentStatus = 'completed';
    this.registrationStatus = 'approved';
    this.transactionId = transactionId;
    this.paymentDate = new Date();
    return this.save();
};

// Instance method to accept waiver
playerSchema.methods.acceptWaiver = function() {
    this.waiverAccepted = true;
    this.waiverAcceptedDate = new Date();
    return this.save();
};

// Virtual for shirt size display name
playerSchema.virtual('shirtSizeDisplayName').get(function() {
    const sizeMap = {
        'YS': 'Youth Small',
        'YM': 'Youth Medium',
        'YL': 'Youth Large',
        'YXL': 'Youth X-Large',
        'AS': 'Adult Small',
        'AM': 'Adult Medium',
        'AL': 'Adult Large',
        'AXL': 'Adult X-Large'
    };
    return sizeMap[this.shirtSize] || this.shirtSize;
});

// Virtual for chosen team display name
playerSchema.virtual('chosenTeamDisplayName').get(function() {
    const teamMap = {
        'HS Boys White': 'High School Boys White',
        'HS Boys Black': 'High School Boys Black',
        'HS Boys Gold': 'High School Boys Gold',
        'MS Boys White': 'Middle School Boys White',
        'MS Boys Black': 'Middle School Boys Black',
        'MS Boys Gold': 'Middle School Boys Gold',
        'MS Boys Red': 'Middle School Boys Red',
        'MS Boys Blue': 'Middle School Boys Blue',
        'MS Girls White': 'Middle School Girls White',
        'MS Girls Black': 'Middle School Girls Black',
        'MS Girls Gold': 'Middle School Girls Gold',
        '4th/5th Boys White': '4th/5th Boys White',
        '4th/5th Boys Black': '4th/5th Boys Black',
        '4th/5th Girls White': '4th/5th Girls White',
        '4th/5th Girls Black': '4th/5th Girls Black',
        '4th/5th Girls Gold': '4th/5th Girls Gold',
        'K/1st (Mixed)': 'Kindergarten/1st Grade (Mixed)',
        '2nd/3rd Girls': '2nd/3rd Grade Girls',
        '2nd/3rd Boys': '2nd/3rd Grade Boys'
    };
    return teamMap[this.chosenTeam] || this.chosenTeam;
});


// Virtual for player status display
playerSchema.virtual('statusDisplay').get(function() {
    if (this.registrationStatus === 'approved' && this.paymentStatus === 'completed') {
        return 'Ready for Practice';
    }
    if (this.registrationStatus === 'approved' && this.paymentStatus === 'pending') {
        return 'Payment Pending';
    }
    return this.registrationStatus.charAt(0).toUpperCase() + this.registrationStatus.slice(1);
});

// Pre-save middleware to calculate age
playerSchema.pre('save', function(next) {
    if (this.isModified('dateOfBirth')) {
        this.calculateAge();
    }
    next();
});

// Transform for JSON output
playerSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;