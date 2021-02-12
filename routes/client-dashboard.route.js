const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Notification = mongoose.model('notification');
const Logger = require('../services/logger');

router.put('/opportunities', async (req, res) => {
    try {
        let data = await Opportunity.aggregate([
            [
                {
                    $match: {
                        $and: [{ clientId: req.client._id }, { isDeleted: false }],
                    },
                },
                {
                    $group: {
                        _id: '$stage',
                        total: {
                            $sum: 1,
                        },
                    },
                },
            ],
        ]).allowDiskUse(true);
        data = data.filter(function(value, index, arr) {
            return value._id !== null;
        });
        let addedStages = data.map((stage) => stage._id);
        let stages = ['INITIAL_CONTACT', 'IN_CONVERSION', 'MEETING_BOOKED', 'FOLLOW_UP', 'POTENTIAL', 'CLOSED', 'LOST'];
        stages.forEach((stage) => {
            if (addedStages.indexOf(stage) === -1) {
                data.push({
                    _id: stage,
                    total: 0,
                });
            }
        });
        let orderedData = [];
        stages.forEach((key) => {
            orderedData.push(data.filter((stage) => stage._id === key).pop());
        });
        return res.status(200).send({
            status: 'SUCCESS',
            data: orderedData,
        });
    } catch (e) {
        Logger.log.error('Error in client-dashboard opportunities API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.put('/pipeline-value', async (req, res) => {
    try {
        let data = await Opportunity.aggregate([
            [
                {
                    $match: {
                        $and: [{ clientId: req.client._id }, { isDeleted: false }],
                    },
                },
                {
                    $group: {
                        _id: '$likelyHood',
                        total: {
                            $sum: 1,
                        },
                        totalDealValue: {
                            $sum: '$dealSize',
                        },
                    },
                },
            ],
        ]).allowDiskUse(true);
        data = data.filter(function(value, index, arr) {
            return value._id !== null;
        });
        let addedPipelines = data.map((pipeline) => pipeline._id);
        let pipelines = ['LIKELY', 'VERY_LIKELY', 'NOT_LIKELY'];
        pipelines.forEach((pipeline) => {
            if (addedPipelines.indexOf(pipeline) === -1) {
                data.push({
                    _id: pipeline,
                    total: 0,
                });
            }
        });
        return res.status(200).send({
            status: 'SUCCESS',
            data: data,
        });
    } catch (e) {
        Logger.log.error('Error in client-dashboard pipeline-value API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.put('/clear-notifications', async (req, res) => {
    try {
        await Notification.updateMany({ clientId: req.client._id }, { isRead: true });
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'Notifications read successfully.',
        });
    } catch (e) {
        Logger.log.error('Error in update notifications API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.get('/get-notifications', async (req, res) => {
    try {
        let notifications = await Notification.find({ clientId: req.client._id, isRead: false });
        // console.log(notifications);
        let showDot = false;
        if (notifications.length !== 0) {
            showDot = true;
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: { showDot },
        });
    } catch (e) {
        Logger.log.error('Error in get notifications API call', e.message || e);
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
