const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Invitee = mongoose.model('invitee');

const Logger = require('../services/logger');

/*
 Add Invited User
 */
router.put('/add-user', async (req, res) => {
    try {
        if (!req.body.publicIdentifier) {
            return res.status(400).send({
                status: 'PUBLIC_IDENTIFIER_NOT_FOUND',
                message: 'Public Identifier not found',
            });
        }
        console.log('client.publicIdentifier::', req.client.publicIdentifier);
        console.log('Add in Invited count::', req.body.publicIdentifier);
        let invitee = await Invitee.findOne({ clientId: req.client._id });
        if (!invitee) {
            invitee = new Invitee({
                clientId: req.client._id,
                lastSyncedAt: new Date(), // Setting it as current time, since no sync is required initially
                invitees: [
                    {
                        publicIdentifier: req.body.publicIdentifier,
                        sentAt: new Date(),
                    },
                ],
            });
            console.log('invitee::', invitee);
        } else {
            console.log('invitee in else::', invitee);
            let inviteePresent = false;
            for (let i = 0; i < invitee.invitees.length; i++) {
                console.log('invitee.invitees[i].publicIdentifier', invitee.invitees[i].publicIdentifier);
                if (invitee.invitees[i].publicIdentifier === req.body.publicIdentifier) {
                    console.log('in if to add...');
                    Logger.log.info('Invitee already added');
                    invitee.invitees[i].sentAt = new Date();
                    invitee.invitees[i].isAccepted = false;
                    inviteePresent = true;
                    break;
                }
            }
            if (!inviteePresent) {
                console.log('in if to add...');
                invitee.invitees.push({
                    publicIdentifier: req.body.publicIdentifier,
                    sentAt: new Date(),
                });
            }
        }
        invitee.save();
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'Public Identifier added successfully',
        });
    } catch (e) {
        Logger.log.error('Error in adding Invited Public Identifier', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 * Export Router
 */
module.exports = router;
