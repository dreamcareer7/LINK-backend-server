const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Opportunity = mongoose.model('opportunity');
const Logger = require('../services/logger');

/**
 * get subscribers by admin
 */
router.get('/get-subscribers', async (req, res) => {
    try {
        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);
        // let client = await Client.find({ isDeleted: false }).select(
        //     '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
        // );
        let client = await Client.paginate(
            { isDeleted: false },
            {
                page,
                limit,
                select:
                    '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
            },
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
router.get('/get-subscriber/:id', async (req, res) => {
    try {
        let promiseArr = [];
        promiseArr.push(
            Client.findOne({ _id: req.params.id, isDeleted: false }).select(
                '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
            ),
        );
        promiseArr.push(
            Opportunity.aggregate([
                { $match: { clientId: mongoose.Types.ObjectId(req.params.id), isDeleted: false } },
                { $group: { _id: null, averageDeal: { $avg: '$dealSize' } } },
            ]).allowDiskUse(true),
        );
        let data = await Promise.all(promiseArr);

        res.status(200).send({
            status: 'SUCCESS',
            data: {
                client: data[0],
                averageDeal: data[1],
            },
        });
    } catch (e) {
        Logger.log.error('Error in get-subscriber API call', e.message || e);
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

        if (req.body.isSubscriptionPaused === true) {
            client.selectedPlan.status = 'PAUSED';
        } else {
            client.selectedPlan.status = client.selectedPlan.currentPlan;
        }

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
        if (req.body.isSubscriptionCancelled === true) {
            client.selectedPlan.status = 'CANCELLED';
        } else {
            client.selectedPlan.status = client.selectedPlan.currentPlan;
        }
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
router.delete('/delete-subscription/:id', async (req, res) => {
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
            !req.body.gender
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
        if (req.body.subscriberImportance) client.subscriberImportance = req.body.subscriberImportance;
        if (req.body.hasOwnProperty('vicSub')) client.vicSub = req.body.vicSub;
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
