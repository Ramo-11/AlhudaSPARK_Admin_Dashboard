// Feedback Model for MongoDB
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
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

        // Rating Questions (1-5 scale)
        ratings: {
            organization: {
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
            volunteers: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            cleanliness: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            foodQuality: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            pricing: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            checkin: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            tournamentManagement: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            quranManagement: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            schedule: {
                type: Number,
                min: 1,
                max: 5,
                default: undefined,
            },
            seating: {
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
        enjoyedMost: {
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
        issues: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        suggestions: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
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
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ 'ratings.overall': -1 });

// Static method to generate unique feedback ID
feedbackSchema.statics.generateFeedbackId = function () {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `FB-${timestamp}-${randomStr}`.toUpperCase();
};

// Virtual for average rating
feedbackSchema.virtual('averageRating').get(function () {
    const ratingValues = Object.values(this.ratings).filter(
        (val) => val !== undefined && val !== null
    );
    if (ratingValues.length === 0) return '0.00';
    const sum = ratingValues.reduce((acc, val) => acc + val, 0);
    return (sum / ratingValues.length).toFixed(2);
});

// Transform for JSON output
feedbackSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
