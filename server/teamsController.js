// teamsController.js
const Team = require('../models/Team');
const logger = require('./logger');
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require('./cloudinaryController');

exports.getAll = async (req, res) => {
    try {
        const data = await Team.find({}).sort('-createdAt');
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: 'Fetch failed' });
    }
};

exports.create = async (req, res) => {
    try {
        const fees = Team.getRegistrationFees();

        // Process uploaded files
        const players = JSON.parse(req.body.players || '[]');

        // Handle player ID photo uploads
        const teamFolderName = `${req.body.teamName.replace(
            /[^a-zA-Z0-9]/g,
            '_'
        )}_${Team.generateTeamId()}`;

        logger.info(`photoFile for player ${i}:`, photoFile);
        for (let i = 0; i < players.length; i++) {
            const photoFile = req.files?.find(
                (file) => file.fieldname === `players[${i}][idPhoto]`
            );
            logger.debug(`photoFile for player ${i}:`, photoFile);
            if (photoFile) {
                const playerName = players[i].playerName || `player_${i + 1}`;
                const uploadResult = await uploadImageToCloudinary(photoFile.buffer, {
                    folder: `alhuda_spark/${teamFolderName}/${playerName.replace(
                        /[^a-zA-Z0-9]/g,
                        '_'
                    )}_${i + 1}`,
                    transformation: [
                        { width: 800, height: 600, crop: 'limit' },
                        { quality: 'auto' },
                        { fetch_format: 'auto' },
                    ],
                });
                players[i].idPhotoUrl = uploadResult.secure_url;
                players[i].idPhotoPublicId = uploadResult.public_id;
                players[i].idPhotoOriginalName = photoFile.originalname;
            }
        }

        const team = new Team({
            teamName: req.body.teamName,
            organization: req.body.organization,
            city: req.body.city,
            tier: req.body.tier,
            gender: req.body.gender,
            coachName: req.body.coachName,
            coachEmail: req.body.coachEmail,
            coachPhone: req.body.coachPhone,
            emergencyContact: {
                name: req.body.emergencyContactName,
                phone: req.body.emergencyContactPhone,
                relationship: req.body.emergencyContactRelationship,
            },
            specialRequirements: req.body.specialRequirements,
            comments: req.body.comments,
            players: players,
            teamId: Team.generateTeamId(),
            registrationFee: fees[req.body.tier] || req.body.registrationFee || 0,
        });

        await team.save();
        res.json({ success: true, data: team });
    } catch (e) {
        res.json({ success: false, message: e.message || 'Create failed' });
    }
};

exports.update = async (req, res) => {
    try {
        const existingTeam = await Team.findOne({ teamId: req.params.id });
        if (!existingTeam) {
            return res.json({ success: false, message: 'Team not found' });
        }

        // Process uploaded files
        const players = JSON.parse(req.body.players || '[]');

        // Handle player ID photo uploads
        for (let i = 0; i < players.length; i++) {
            const photoFile = req.files?.find(
                (file) => file.fieldname === `players[${i}][idPhoto]`
            );
            if (photoFile) {
                // Delete old photo if exists
                const existingPlayer = existingTeam.players[i];
                if (existingPlayer?.idPhotoPublicId) {
                    try {
                        await deleteImageFromCloudinary(existingPlayer.idPhotoPublicId);
                    } catch (deleteError) {
                        console.error('Error deleting old photo:', deleteError);
                    }
                }

                // Upload new photo
                const teamFolderName = `${req.body.teamName.replace(/[^a-zA-Z0-9]/g, '_')}_${
                    req.params.id
                }`;
                const playerName = players[i].playerName || `player_${i + 1}`;
                const uploadResult = await uploadImageToCloudinary(photoFile.buffer, {
                    folder: `alhuda_spark/${teamFolderName}/${playerName.replace(
                        /[^a-zA-Z0-9]/g,
                        '_'
                    )}_${i + 1}`,
                    transformation: [
                        { width: 800, height: 600, crop: 'limit' },
                        { quality: 'auto' },
                        { fetch_format: 'auto' },
                    ],
                });
                players[i].idPhotoUrl = uploadResult.secure_url;
                players[i].idPhotoPublicId = uploadResult.public_id;
                players[i].idPhotoOriginalName = photoFile.originalname;
            } else if (existingTeam.players[i]?.idPhotoUrl) {
                // Keep existing photo data
                players[i].idPhotoUrl = existingTeam.players[i].idPhotoUrl;
                players[i].idPhotoPublicId = existingTeam.players[i].idPhotoPublicId;
                players[i].idPhotoOriginalName = existingTeam.players[i].idPhotoOriginalName;
            }
        }

        const updateData = {
            teamName: req.body.teamName,
            organization: req.body.organization,
            city: req.body.city,
            category: req.body.category,
            coachName: req.body.coachName,
            coachEmail: req.body.coachEmail,
            coachPhone: req.body.coachPhone,
            emergencyContact: {
                name: req.body.emergencyContactName,
                phone: req.body.emergencyContactPhone,
                relationship: req.body.emergencyContactRelationship,
            },
            specialRequirements: req.body.specialRequirements,
            comments: req.body.comments,
            players: players,
        };

        const data = await Team.findOneAndUpdate({ teamId: req.params.id }, updateData, {
            new: true,
            runValidators: true,
        });

        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: e.message || 'Update failed' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const data = await Team.findOneAndUpdate(
            { teamId: req.params.id },
            { registrationStatus: req.body.registrationStatus, notes: req.body.notes || '' },
            { new: true }
        );
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: 'Status update failed' });
    }
};

exports.remove = async (req, res) => {
    try {
        await Team.findOneAndDelete({ teamId: req.params.id });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: 'Delete failed' });
    }
};

exports.updatePayment = async (req, res) => {
    try {
        const updateData = {
            paymentStatus: req.body.paymentStatus,
            paymentMethod: req.body.paymentMethod,
            transactionId: req.body.transactionId,
        };

        if (req.body.paymentDate) {
            updateData.paymentDate = req.body.paymentDate;
        }

        const data = await Team.findOneAndUpdate({ teamId: req.params.id }, updateData, {
            new: true,
        });

        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: e.message || 'Payment update failed' });
    }
};
