const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Logger = require('../services/logger');

router.get('/activity-breakdown', async (req, res) => {
    try {
        if (!req.query.startDate || !req.query.endDate) {
            return res.status(400).send({
                status: 'ERROR',
                message: 'Start Date or End Date not found',
            });
        }
        let startDate = new Date(req.query.startDate);
        let endDate = new Date(req.query.endDate);
        let data = await Opportunity.aggregate([
            [
                {
                    $match: {
                        clientId: req.client._id,
                        isDeleted: false,
                        createdAt: { $gte: startDate, $lte: endDate },
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
        let stages = ['INITIAL_CONTACT', 'IN_CONVERSION', 'MEETING_BOOKED', 'FOLLOW_UP', 'CLOSED', 'LOST'];
        stages.forEach((stage) => {
            if (addedStages.indexOf(stage) === -1) {
                data.push({
                    _id: stage,
                    total: 0,
                });
            }
        });
        let stageMap = {
            INITIAL_CONTACT: 'INVITED',
            FOLLOW_UP: 'ACCEPTED',
            IN_CONVERSION: 'CONVERSATIONS',
            MEETING_BOOKED: 'MEETINGS',
            CLOSED: 'DEALS CLOSED',
            LOST: 'DEALS LOST',
        };
        for (let i = 0; i < data.length; i++) {
            if (data[i]._id === 'POTENTIAL') {
                data[i].splice(i, 1);
                break;
            }
        }
        for (let i = 0; i < data.length; i++) {
            data[i]._id = stageMap[data[i]._id];
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: data,
        });
    } catch (e) {
        Logger.log.error('Error in client-dashboard opportunities API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.get('/pipeline-value', async (req, res) => {
    try {
        if (!req.query.startDate || !req.query.endDate) {
            return res.status(400).send({
                status: 'ERROR',
                message: 'Start Date or End Date not found',
            });
        }
        let startDate = new Date(req.query.startDate);
        let endDate = new Date(req.query.endDate);
        let data = await Opportunity.aggregate([
            [
                {
                    $match: {
                        clientId: req.client._id,
                        isDeleted: false,
                        createdAt: { $gte: startDate, $lte: endDate },
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
/**
 * Export Router
 */
module.exports = router;
