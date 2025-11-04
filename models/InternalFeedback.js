// Internal Feedback Model for MongoDB
const mongoose = require('mongoose');

const internalFeedbackSchema = new mongoose.Schema(
    {
        // Unique feedback ID
        feedbackId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Contact Information (optional)
        name: {
            type: String,
            trim: true,
            default: '',
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: '',
        },

        // Roles/Areas worked in (multiple selections)
        roles: {
            type: [String],
            default: [],
            enum: [
                'tournament',
                'bazaar',
                'quran',
                'registration',
                'food',
                'volunteer',
                'setup',
                'communications',
                'website',
                'other',
            ],
        },

        // Other role specification
        otherRole: {
            type: String,
            trim: true,
            default: '',
        },

        // Rating Questions (1-5 scale)
        ratings: {
            responsibilities: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            communication: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            execution: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            problemHandling: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            resources: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            website: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            coordination: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            overall: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
        },

        // Open-ended questions
        wentWell: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        wentPoorly: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        improvements: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        otherComments: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },

        // Yes/No questions
        volunteerAgain: {
            type: Boolean,
            default: null,
        },
        helpPlan: {
            type: Boolean,
            default: null,
        },

        // Admin fields
        isActive: {
            type: Boolean,
            default: true,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
internalFeedbackSchema.index({ createdAt: -1 });
internalFeedbackSchema.index({ 'ratings.overall': -1 });

// Static method to generate unique feedback ID
internalFeedbackSchema.statics.generateFeedbackId = function () {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `IFB-${timestamp}-${randomStr}`.toUpperCase();
};

// Virtual for average rating
internalFeedbackSchema.virtual('averageRating').get(function () {
    const ratingValues = Object.values(this.ratings).filter(
        (val) => val !== undefined && val !== null
    );
    if (ratingValues.length === 0) return '0.00';
    const sum = ratingValues.reduce((acc, val) => acc + val, 0);
    return (sum / ratingValues.length).toFixed(2);
});

// Transform for JSON output
internalFeedbackSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const InternalFeedback = mongoose.model('InternalFeedback', internalFeedbackSchema);

module.exports = InternalFeedback;
