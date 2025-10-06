// Team Model for MongoDB
const mongoose = require('mongoose');

// Player sub-schema
const playerSchema = new mongoose.Schema(
    {
        playerName: {
            type: String,
            required: true,
            trim: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        idPhotoUrl: {
            type: String,
            required: function () {
                const category = this.parent()?.category;
                return [
                    'boys_middle',
                    'girls_middle',
                    'boys_high_competitive',
                    'boys_high_recreational',
                    'girls_high',
                ].includes(category);
            },
            trim: true,
        },
        idPhotoPublicId: {
            type: String,
            default: null,
        },
        idPhotoOriginalName: {
            type: String,
            required: function () {
                const category = this.parent()?.category;
                return [
                    'boys_middle',
                    'girls_middle',
                    'boys_high_competitive',
                    'boys_high_recreational',
                    'girls_high',
                ].includes(category);
            },
            trim: true,
        },
    },
    {
        _id: true,
    }
);

const teamSchema = new mongoose.Schema(
    {
        // Unique team ID
        teamId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Team Information
        teamName: {
            type: String,
            required: true,
            trim: true,
        },
        organization: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },

        // Competition Details
        category: {
            type: String,
            required: true,
            enum: [
                'boys_elem_1_3',
                'boys_elem_4_5',
                'girls_elem_1_5',
                'boys_middle',
                'girls_middle',
                'boys_high_competitive',
                'boys_high_recreational',
                'girls_high',
                'mens_open',
            ],
            lowercase: true,
        },

        // Coach/Contact Information
        coachName: {
            type: String,
            required: true,
            trim: true,
        },
        coachEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        coachPhone: {
            type: String,
            required: true,
            trim: true,
        },

        // Players (minimum 5, maximum 10)
        players: {
            type: [playerSchema],
            required: true,
            validate: [
                {
                    validator: function (players) {
                        return players.length >= 5;
                    },
                    message: 'Team must have at least 5 players',
                },
                {
                    validator: function (players) {
                        return players.length <= 10;
                    },
                    message: 'Team cannot have more than 10 players',
                },
            ],
        },

        // Registration Status
        registrationStatus: {
            type: String,
            required: true,
            enum: ['pending', 'approved', 'rejected', 'waitlisted'],
            default: 'pending',
        },

        // Payment Information
        registrationFee: {
            type: Number,
            required: true,
            default: 0,
        },
        paymentMethod: {
            type: String,
            enum: ['check', 'cash', 'zelle', 'venmo', 'stripe'],
            default: null,
        },
        zelleReceipt: {
            type: String,
            default: '',
        },
        zelleReceiptPublicId: {
            type: String,
            default: '',
        },
        paymentStatus: {
            type: String,
            required: true,
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
            default: 'pending',
        },
        transactionId: {
            type: String,
            default: null,
        },
        paymentDate: {
            type: Date,
            default: null,
        },

        // Tournament Details
        groupAssignment: {
            type: String,
            default: null,
        },
        seedNumber: {
            type: Number,
            default: null,
        },

        // Additional Information
        emergencyContact: {
            name: {
                type: String,
                required: true,
                trim: true,
            },
            phone: {
                type: String,
                required: true,
                trim: true,
            },
            relationship: {
                type: String,
                required: true,
                trim: true,
            },
        },

        specialRequirements: {
            type: String,
            default: '',
            maxlength: 300,
        },

        comments: {
            type: String,
            default: '',
        },

        // Admin fields
        notes: {
            type: String,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        // Document verification
        documentsVerified: {
            type: Boolean,
            default: false,
        },
        verifiedBy: {
            type: String,
            default: null,
        },
        verifiedDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
teamSchema.index({ category: 1, registrationStatus: 1 });
teamSchema.index({ organization: 1 });
teamSchema.index({ city: 1 });
teamSchema.index({ createdAt: -1 });

// Static method to generate unique team ID
teamSchema.statics.generateTeamId = function () {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `TM-${timestamp}-${randomStr}`.toUpperCase();
};

// Static method to get registration fees by category
teamSchema.statics.getRegistrationFees = function () {
    return {
        boys_elem_1_3: 350,
        boys_elem_4_5: 350,
        girls_elem_1_5: 350,
        boys_middle: 350,
        girls_middle: 350,
        boys_high_competitive: 350,
        boys_high_recreational: 350,
        girls_high: 350,
        mens_open: 350,
    };
};

// Instance method to mark payment as complete
teamSchema.methods.markPaymentComplete = function (transactionId) {
    this.paymentStatus = 'completed';
    this.transactionId = transactionId;
    this.paymentDate = new Date();
    return this.save();
};

// Instance method to approve team
teamSchema.methods.approveTeam = function (verifiedBy = null) {
    this.registrationStatus = 'approved';
    this.documentsVerified = true;
    this.verifiedBy = verifiedBy;
    this.verifiedDate = new Date();
    return this.save();
};

// Instance method to assign to group
teamSchema.methods.assignToGroup = function (groupName, seedNumber = null) {
    this.groupAssignment = groupName;
    this.seedNumber = seedNumber;
    return this.save();
};

// Static method to find teams by category
teamSchema.statics.findByCategory = function (category) {
    return this.find({
        category: category.toLowerCase(),
        registrationStatus: 'approved',
        isActive: true,
    }).sort({ createdAt: -1 });
};

// Static method to find teams by organization
teamSchema.statics.findByOrganization = function (organization) {
    return this.find({
        organization: new RegExp(organization, 'i'),
        isActive: true,
    }).sort({ createdAt: -1 });
};

// Static method to find approved teams
teamSchema.statics.findApprovedTeams = function () {
    return this.find({
        registrationStatus: 'approved',
        paymentStatus: 'completed',
        isActive: true,
    }).sort({ category: 1, createdAt: -1 });
};

// Static method to find pending registrations
teamSchema.statics.findPendingRegistrations = function () {
    return this.find({
        registrationStatus: 'pending',
    }).sort({ createdAt: -1 });
};

// Virtual for category display name
teamSchema.virtual('categoryDisplayName').get(function () {
    const categoryMap = {
        boys_elem_1_3: 'Boys Elementary (1-3rd)',
        boys_elem_4_5: 'Boys Elementary (4-5th)',
        girls_elem_1_5: 'Girls Elementary (1-5th)',
        boys_middle: 'Boys Middle School (6-8th)',
        girls_middle: 'Girls Middle School (6-8th)',
        boys_high_competitive: 'Boys High School (9-12th) Competitive',
        boys_high_recreational: 'Boys High School (9-12th) Recreational',
        girls_high: 'Girls High School (9-12th)',
        mens_open: "Men's Open/Alumni",
    };
    return categoryMap[this.category] || this.category;
});

// Virtual for player count
teamSchema.virtual('playerCount').get(function () {
    return this.players.length;
});

// Virtual for team status display
teamSchema.virtual('statusDisplay').get(function () {
    if (this.registrationStatus === 'approved' && this.paymentStatus === 'completed') {
        return 'Ready to Play';
    }
    if (this.registrationStatus === 'approved' && this.paymentStatus === 'pending') {
        return 'Payment Pending';
    }
    return this.registrationStatus.charAt(0).toUpperCase() + this.registrationStatus.slice(1);
});

// Transform for JSON output
teamSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
