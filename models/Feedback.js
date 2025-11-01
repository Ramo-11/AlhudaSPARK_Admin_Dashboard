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
                required: true,
                min: 1,
                max: 5,
            },
            communication: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            volunteers: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            cleanliness: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            foodQuality: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            pricing: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            checkin: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            tournamentManagement: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            quranManagement: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            schedule: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            seating: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            overall: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
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
    const ratings = this.ratings;
    const sum =
        ratings.organization +
        ratings.communication +
        ratings.volunteers +
        ratings.cleanliness +
        ratings.foodQuality +
        ratings.pricing +
        ratings.checkin +
        ratings.tournamentManagement +
        ratings.quranManagement +
        ratings.schedule +
        ratings.seating +
        ratings.overall;
    return (sum / 12).toFixed(2);
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
