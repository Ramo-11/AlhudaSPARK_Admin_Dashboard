// Bounce House Registration Model for MongoDB
const mongoose = require('mongoose');

const childSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        age: {
            type: Number,
            required: true,
            min: 1,
            max: 17,
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female'],
            lowercase: true,
        },
    },
    { _id: false }
);

const bounceHouseRegistrationSchema = new mongoose.Schema(
    {
        // Unique registration ID
        registrationId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Parent/Guardian Information
        parentName: {
            type: String,
            required: true,
            trim: true,
        },
        parentEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        parentPhone: {
            type: String,
            required: true,
            trim: true,
        },

        // Payment Method
        paymentMethod: {
            type: String,
            required: true,
            enum: ['cash', 'card', 'zelle', 'other'],
        },
        otherPaymentMethod: {
            type: String,
            trim: true,
            required: function () {
                return this.paymentMethod === 'other';
            },
        },

        // Children Information (1-5 children)
        children: {
            type: [childSchema],
            required: true,
            validate: [
                {
                    validator: function (children) {
                        return children.length >= 1;
                    },
                    message: 'At least one child is required',
                },
                {
                    validator: function (children) {
                        return children.length <= 5;
                    },
                    message: 'Maximum 5 children allowed',
                },
            ],
        },

        // Signature Information
        signature: {
            type: String,
            required: true,
        },
        signatureType: {
            type: String,
            required: true,
            enum: ['draw', 'type'],
            default: 'draw',
        },

        // Terms Acceptance
        acceptedTerms: {
            type: Boolean,
            required: true,
            default: false,
        },
        acceptedTermsDate: {
            type: Date,
            default: Date.now,
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
bounceHouseRegistrationSchema.index({ parentEmail: 1, parentName: 1 });
bounceHouseRegistrationSchema.index({ createdAt: -1 });

// Static method to generate unique registration ID
bounceHouseRegistrationSchema.statics.generateRegistrationId = function () {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `BH-${timestamp}-${randomStr}`.toUpperCase();
};

// Virtual for child count
bounceHouseRegistrationSchema.virtual('childCount').get(function () {
    return this.children.length;
});

// Transform for JSON output
bounceHouseRegistrationSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const BounceHouseRegistration = mongoose.model(
    'BounceHouseRegistration',
    bounceHouseRegistrationSchema
);

module.exports = BounceHouseRegistration;
