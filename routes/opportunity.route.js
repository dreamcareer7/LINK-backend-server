const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Conversation = mongoose.model('conversation');
const Logger = require('../services/logger');
const opportunityHelper = require('../helper/opportunity.helper');
const cookieHelper = require('../helper/cookie.helper');
const firebaseHelper = require('../helper/firebase-notification');

/**
 * add opportunity
 */
router.post('/add-opportunity', async (req, res) => {
    try {
        if (req.body.publicIdentifier) {
            let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
            let opportunityData = await opportunityHelper.getProfile(req.body.publicIdentifier, cookieStr, ajaxToken);
            opportunityData.clientId = req.client._id;
            let opportunity = await Opportunity.findOne({
                clientId: req.client._id,
                isDeleted: false,
                publicIdentifier: req.body.publicIdentifier,
            });

            if (opportunity) {
                opportunity = await Opportunity.findOneAndUpdate(
                    { clientId: req.client._id, isDeleted: false, publicIdentifier: req.body.publicIdentifier },
                    opportunityData,
                    { new: true },
                );
                Logger.log.info('Opportunity updated.');
            } else {
                opportunity = new Opportunity(opportunityData);
                await opportunity.save();
                Logger.log.info('New Opportunity added.');
            }
            return res.status(200).send({
                status: 'SUCCESS',
                data: opportunity,
            });
        } else if (req.body.conversationId) {
            let publicIdentifier;
            let dbConversation = await Conversation.findOne({
                clientId: req.client._id,
                'conversations.conversationId': req.body.conversationId,
            });

            if (!dbConversation) {
                return res.status(400).send({
                    status: 'NOT_FOUND',
                    message: 'ConversationId is Not Found in db.',
                });
            }

            for (let i = 0; i < dbConversation.conversations.length; i++) {
                if (dbConversation.conversations[i].conversationId == req.body.conversationId) {
                    publicIdentifier = dbConversation.conversations[i].publicIdentifier;
                }
            }

            let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
            let opportunityData = await opportunityHelper.getProfile(publicIdentifier, cookieStr, ajaxToken);
            opportunityData.clientId = req.client._id;
            let opportunity = await Opportunity.findOne({
                clientId: req.client._id,
                isDeleted: false,
                publicIdentifier: publicIdentifier,
            });

            if (opportunity) {
                opportunity = await Opportunity.findOneAndUpdate(
                    { clientId: req.client._id, isDeleted: false, publicIdentifier: publicIdentifier },
                    opportunityData,
                    { new: true },
                );
                Logger.log.info('Opportunity updated.');
            } else {
                opportunity = new Opportunity(opportunityData);
                await opportunity.save();
                Logger.log.info('New Opportunity added.');
            }
            return res.status(200).send({
                status: 'SUCCESS',
                data: opportunity,
            });
        } else {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Required field is Missing.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in add opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * update opportunity
 */
router.put('/update-opportunity/:id', async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Require field is Missing.',
            });
        }
        let opportunity = await Opportunity.findOneAndUpdate(
            { _id: req.params.id, clientId: req.client._id, isDeleted: false },
            req.body,
            { new: true },
        );
        if (opportunity) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: opportunity,
            });
        } else {
            return res.status(400).send({
                status: 'NOT_FOUND',
                data: 'Opportunity is not found.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in update opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * get opportunity
 */
router.get('/get-opportunity', async (req, res) => {
    try {
        let opportunitys = await Opportunity.find({ clientId: req.client._id, isDeleted: false }, req.body, {
            new: true,
        });

        if (opportunitys) {
            let publicIdentifierArr = [];
            for (let i = 0; i < opportunitys.length; i++) {
                publicIdentifierArr.push(opportunitys[i].publicIdentifier);
            }
            return res.status(200).send({
                status: 'SUCCESS',
                data: publicIdentifierArr,
            });
        } else {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Opportunitys  is Not found..',
            });
        }
    } catch (e) {
        Logger.log.error('Error in get opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * delete opportunity
 */
router.delete('/delete-opportunity/:id', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOneAndUpdate(
            { _id: req.params.id, clientId: req.client._id, isDeleted: false },
            { isDeleted: true },
            { new: true },
        );
        if (opportunity) {
            return res.status(200).json({
                status: 'SUCCESS',
                message: 'opportunitys is Deleted SUCCESSfully.',
            });
        } else {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunitys is not Found!',
            });
        }
    } catch (e) {
        Logger.log.error('Error in delete Opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * sync with linkedIn opportunity by jayla app
 */

router.post('/sync-with-linkedIn/:id', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOne({ _id: req.params.id, clientId: req.client._id, isDeleted: false });
        if (!opportunity) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunitys is not Found!',
            });
        }
        let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
        opportunityData = await opportunityHelper.getProfile(opportunity.publicIdentifier, cookieStr, ajaxToken);

        opportunity = await Opportunity.findOneAndUpdate(
            { _id: req.params.id, clientId: req.client._id, isDeleted: false },
            opportunityData,
            { new: true },
        );
        return res.status(200).json({
            status: 'SUCCESS',
            data: opportunity,
        });
    } catch (e) {
        Logger.log.error('Error in sync with linkedIn API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * Send Opportunity Notifications
 */

router.post('/send-notifications/:id', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOne({ _id: req.params.id, clientId: req.client._id, isDeleted: false });
        if (!opportunity) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunitys is not Found!',
            });
        }
        firebaseHelper.sendNotification({
            tokens: req.client.fcmToken,
            data: { notificationFor: 'OPPORTUNITY_FOLLOWUP', data: opportunity },
        });
        return res.status(200).json({
            status: 'SUCCESS',
            data: opportunity,
        });
    } catch (e) {
        Logger.log.error('Error in sync with linkedIn API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * Export Router
 */
module.exports = router;
