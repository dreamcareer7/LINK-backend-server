const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Logger = require('../services/logger');

/**
 * get subscribers by admin
 */
router.get('/get-subscribers', async (req, res) => {
    try {
        let client = await Client.find({ isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
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
/**
 * paused subscribers by admin
 */
router.put('/paused-subscription/:id', async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.params.id, isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
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
/**
 * cancel subscribers by admin
 */
router.put('/cancel-subscription/:id', async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.params.id, isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
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
/**
 * delete subscribers by admin
 */
router.put('/delete-subscription/:id', async (req, res) => {
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
            message: 'subscription deleted Successfully.',
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
 * update subscriber by admin
 */
router.put('/update-subscriber/:id', async (req, res) => {
    try {
        if (
            !req.body.firstName ||
            !req.body.lastName ||
            !req.body.email ||
            !req.body.industry ||
            !req.body.companyLocation ||
            !req.body.gender ||
            !req.body.subscriberImportance
        ) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Required Field is empty.',
            });
        }
        let client = await Client.findOne({ _id: req.params.id, isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken',
        );

        if (!client) {
            return res.status(400).json({
                status: 'SUBSCRIBER_NOT_FOUND',
                message: 'subscriber is not found.',
            });
        }
        client.firstName = req.body.firstName;
        client.lastName = req.body.lastName;
        client.email = req.body.email;
        client.industry = req.body.industry;
        client.companyLocation = req.body.companyLocation;
        client.gender = req.body.gender;
        client.subscriberImportance = req.body.subscriberImportance;
        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            data: client,
        });
    } catch (e) {
        Logger.log.error('Error in update subscriber API call', e.message || e);
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