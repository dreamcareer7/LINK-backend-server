const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Logger = require('../services/logger');
const authMiddleWare = require('../middleware/authenticate');

router.get('/get-subscribers', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.find({ isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken',
        );
        if (!client) {
            return res.status(400).json({
                status: 'SUBSCRIBER_NOT_FOUND',
                message: 'subscriber is not found.',
            });
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: client,
        });
    } catch (e) {
        Logger.log.error('Error in get-subscribers API call', e.message || e);
        return res.status(500).json({
            status: 'ERROR',
            message: error.message,
        });
    }
});
router.put('/paused-subscription/:id', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.params.id, isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken',
        );
        if (!client) {
            return res.status(400).json({
                status: 'SUBSCRIBER_NOT_FOUND',
                message: 'subscriber is not found.',
            });
        }
        console.log(client);
        client.isSubscriptionPaused = true;
        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            data: client,
        });
    } catch (e) {
        Logger.log.error('Error in paused-subscription API call', e.message || e);
        return res.status(500).json({
            status: 'ERROR',
            message: error.message,
        });
    }
});
router.put('/cancel-subscription/:id', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.params.id, isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken',
        );
        if (!client) {
            return res.status(400).json({
                status: 'SUBSCRIBER_NOT_FOUND',
                message: 'subscriber is not found.',
            });
        }
        client.isSubscribed = false;
        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            data: client,
        });
    } catch (e) {
        Logger.log.error('Error in cancel-subscription API call', e.message || e);
        return res.status(500).json({
            status: 'ERROR',
            message: error.message,
        });
    }
});
router.put('/delete-subscription/:id', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.params.id, isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken',
        );
        if (!client) {
            return res.status(400).json({
                status: 'SUBSCRIBER_NOT_FOUND',
                message: 'subscriber is not found.',
            });
        }
        client.isDeleted = true;
        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'subscription deleted sucessfully.',
        });
    } catch (e) {
        Logger.log.error('Error in delete-subscription API call', e.message || e);
        return res.status(500).json({
            status: 'ERROR',
            message: error.message,
        });
    }
});

/**
 * Export Router
 */
module.exports = router;
