const express = require('express');
const { Parser } = require('json2csv');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Opportunity = mongoose.model('opportunity');
const Conversation = mongoose.model('conversation');
const Payment = mongoose.model('payment');
const Notification = mongoose.model('notification');
const Logger = require('../services/logger');

/**
 * get subscribers by admin
 */
router.get('/get-subscribers', async (req, res) => {
    try {
        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);
        let queryObj = {
            isDeleted: false,
            isSubscribed: true,
        };
        if (req.query.subscriptionType) {
            queryObj['selectedPlan.status'] = req.query.subscriptionType;
        }
        let startDate;
        let endDate;
        let sortOrder = req.query.sortOrder;
        if (req.query.startDate) {
            startDate = new Date(req.query.startDate);
        } else {
            startDate = new Date();
            startDate.setTime(startDate.getTime() - 30 * 24 * 3600 * 1000);
        }
        if (req.query.endDate) {
            endDate = new Date(req.query.endDate);
        } else {
            endDate = new Date();
            endDate.setHours(23, 59, 59);
        }
        queryObj.createdAt = { $gte: startDate, $lte: endDate };
        let client = await Client.paginate(queryObj, {
            page,
            limit,
            sort: { createdAt: sortOrder === 'ASC' ? 1 : -1 },
            select:
                '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
        });

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
            message: e.message,
        });
    }
});
/**
 * Download subscribers by admin
 */
router.get('/get-subscribers/download', async (req, res) => {
    try {
        let clients = await Client.find({ isDeleted: false, isSubscribed: true })
            .select(
                'firstName lastName email phone title industry companyName linkedInUrl companySize companyLocation selectedPlan',
            )
            .lean();
        let fields = [
            'first-name',
            'last-name',
            'linkedIn-url',
            'email',
            'phone',
            'location',
            'title',
            'company-name',
            'industry',
            'company-size',
            'selected-plan',
        ];
        const rawJson = clients.map((x) => {
            return {
                'first-name': x.firstName,
                'last-name': x.lastName,
                'linkedIn-url': x.linkedInUrl,
                email: x.email,
                phone: x.phone,
                location: x.companyLocation,
                title: x.title,
                'company-name': x.companyName,
                industry: x.industry,
                'company-size': x.companySize,
                'selected-plan': x.selectedPlan ? (x.selectedPlan.status ? x.selectedPlan.status : '') : '',
            };
        });
        const json2csvParser = new Parser({ fields });
        const csvData = json2csvParser.parse(rawJson);
        res.header('Content-Type', 'text/csv');
        res.send(csvData);
    } catch (e) {
        Logger.log.error('Error in download subscribers API call', e.message || e);
        return res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.get('/get-subscriber/:id', async (req, res) => {
    try {
        let promiseArr = [];
        promiseArr.push(
            Client.findOne({ _id: req.params.id, isDeleted: false })
                .select(
                    '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
                )
                .lean(),
        );
        promiseArr.push(
            Opportunity.aggregate([
                { $match: { clientId: mongoose.Types.ObjectId(req.params.id), isDeleted: false } },
                { $group: { _id: null, averageDeal: { $avg: '$dealSize' } } },
            ]).allowDiskUse(true),
        );
        let data = await Promise.all(promiseArr);
        let activePlans = ['FREE_TRIAL', 'MONTHLY', 'YEARLY'];
        data[0].isActive =
            data[0].selectedPlan &&
            data[0].selectedPlan.status &&
            activePlans.indexOf(data[0].selectedPlan.status) !== -1;
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
            message: e.message,
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
            client.selectedPlan.status = client.selectedPlan.planSelected;
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
            client.selectedPlan.status = client.selectedPlan.planSelected;
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
        let promiseArr = [];
        promiseArr.push(client.save());
        promiseArr.push(Opportunity.updateMany({ clientId: client._id, isDeleted: false }, { isDeleted: true }));
        promiseArr.push(Conversation.updateMany({ clientId: client._id, isDeleted: false }, { isDeleted: true }));
        promiseArr.push(Payment.updateMany({ clientId: client._id, isDeleted: false }, { isDeleted: true }));
        promiseArr.push(Notification.updateMany({ clientId: client._id, isDeleted: false }, { isDeleted: true }));
        await Promise.all(promiseArr);
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
            !req.body.hasOwnProperty('firstName') ||
            !req.body.hasOwnProperty('lastName') ||
            !req.body.hasOwnProperty('email')
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
        client.phone = req.body.phone;
        client.industry = req.body.industry;
        client.companyLocation = req.body.companyLocation;
        client.companySize = req.body.companySize;
        client.gender = req.body.gender;
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
 * search-subscriber
 */

router.put('/search-subscriber', async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).send({
                status: 'ERROR',
                message: 'name is required in body.',
            });
        }

        let name = req.body.name
            .replace(/  +/g, ' ')
            .split(' ')
            .slice(0, 2);

        let subscribers = await Client.find({
            isDeleted: false,
            $or: [
                { $and: [{ firstName: new RegExp(name[0], 'i') }, { lastName: new RegExp(name[1], 'i') }] },
                { $and: [{ firstName: new RegExp(name[1], 'i') }, { lastName: new RegExp(name[0], 'i') }] },
            ],
        })
            .select('firstName lastName')
            .lean();
        return res.status(200).send({
            status: 'SUCCESS',
            data: subscribers,
        });
    } catch (e) {
        Logger.log.error('Error in search-opportunity API call.', e.message || e);
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
