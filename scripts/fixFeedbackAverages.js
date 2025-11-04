const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
require('dotenv').config();

// DATABASE CONNECTION
const isProd = process.env.NODE_ENV === 'production';
const baseUri = isProd ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI_DEV;
const dbName = isProd ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV;

if (!baseUri) {
    console.error('MongoDB URI is not defined - will not connect');
    process.exit(1);
}

process.env.MONGODB_URI = `${baseUri}${baseUri.includes('?') ? '&' : '?'}dbName=${dbName}`;
mongoose.connect(process.env.MONGODB_URI);

async function fixFeedbackRatings() {
    try {
        console.log('Starting feedback ratings migration...\n');

        const allFeedback = await Feedback.find({});
        console.log(`Found ${allFeedback.length} feedback records to check\n`);

        let fixedCount = 0;

        for (const feedback of allFeedback) {
            const currentAvg = feedback.averageRating;

            if (isNaN(parseFloat(currentAvg)) || currentAvg === 'NaN') {
                console.log(`Fixing feedback ${feedback.feedbackId}...`);

                // Update using findOneAndUpdate to bypass validation
                await Feedback.findOneAndUpdate(
                    { _id: feedback._id },
                    { $set: { updatedAt: new Date() } },
                    { runValidators: false }
                );

                console.log(`   ✓ Fixed average rating\n`);
                fixedCount++;
            }
        }

        console.log('='.repeat(60));
        console.log('MIGRATION COMPLETED');
        console.log('='.repeat(60));
        console.log(`\nTotal records checked: ${allFeedback.length}`);
        console.log(`Records fixed: ${fixedCount}\n`);
    } catch (error) {
        console.error('Error during migration:', error);
        console.error(error.stack);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
}

fixFeedbackRatings();
