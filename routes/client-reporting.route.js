const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Invitee = mongoose.model('invitee');
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
        let promiseArr = [];
        promiseArr.push(
            Invitee.aggregate([
                {
                    $match: {
                        clientId: req.client._id,
                        isDeleted: false,
                    },
                },
                {
                    $unwind: {
                        path: '$invitees',
                    },
                },
                {
                    $match: {
                        clientId: req.client._id,
                        isDeleted: false,
                        sentAt: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: '$invitees.isAccepted',
                        total: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $project: {
                        _id: {
                            $cond: {
                                if: {
                                    $eq: ['$_id', true],
                                },
                                then: 'ACCEPTED',
                                else: 'INVITED',
                            },
                        },
                        total: '$total',
                    },
                },
            ]),
        );
        promiseArr.push(
            Opportunity.aggregate([
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
            ]).allowDiskUse(true),
        );
        let responses = await Promise.all(promiseArr);
        let data = responses[0];
        let inviteeData = responses[1];
        data = [...data, ...inviteeData];
        let addedStages = data.map((stage) => stage._id.toString());
        let stages = ['ACCEPTED', 'INVITED', 'IN_CONVERSION', 'MEETING_BOOKED', 'CLOSED', 'LOST'];
        stages.forEach((stage) => {
            if (addedStages.indexOf(stage) === -1) {
                data.push({
                    _id: stage,
                    total: 0,
                });
            }
        });
        let stageMap = {
            ACCEPTED: 'ACCEPTED',
            INVITED: 'INVITED',
            IN_CONVERSION: 'CONVERSATIONS',
            MEETING_BOOKED: 'MEETINGS',
            CLOSED: 'DEALS CLOSED',
            LOST: 'DEALS LOST',
        };
        data = data.filter((d) => d._id !== 'POTENTIAL' || d._id !== 'INITIAL_CONTACT' || d._id !== 'FOLLOW_UP');
        let orderedData = [];
        Object.keys(stageMap).forEach((key) => {
            orderedData.push(data.filter((stage) => stage._id === key).pop());
        });
        for (let i = 0; i < orderedData.length; i++) {
            orderedData[i]._id = stageMap[orderedData[i]._id];
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: orderedData,
        });
    } catch (e) {
        Logger.log.error('Error in client-reporting activity breakdown API call', e.message || e);
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
        Logger.log.error('Error in client-reporting pipeline value API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

router.get('/total-sales', async (req, res) => {
    try {
        if (!req.query.startDate || !req.query.endDate) {
            return res.status(400).send({
                status: 'ERROR',
                message: 'Start Date or End Date not found',
            });
        }
        let startDate = new Date(req.query.startDate);
        let endDate = new Date(req.query.endDate);
        let totalDays = Math.ceil(endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000);
        let groupOf = Math.ceil(totalDays / 20);
        let completeGroups = Math.floor(totalDays / groupOf);
        let remaining = totalDays - completeGroups * groupOf;
        let totalBars = completeGroups;
        if (remaining) totalBars++;
        let responseObj = {};
        for (let i = 0; i < totalBars; i++) {
            let tempDate = new Date(startDate.getTime());
            // console.log('tempDate::', tempDate);
            responseObj[tempDate.setDate(tempDate.getDate() + i * groupOf)] = 0;
        }
        let data = await Opportunity.aggregate([
            [
                {
                    $match: {
                        clientId: req.client._id,
                        isDeleted: false,
                        createdAt: { $gte: startDate, $lte: endDate },
                        stage: 'CLOSED',
                    },
                },
                {
                    $group: {
                        _id: {
                            month: {
                                $month: {
                                    date: '$createdAt',
                                },
                            },
                            day: {
                                $dayOfMonth: {
                                    date: '$createdAt',
                                },
                            },
                            year: {
                                $year: {
                                    date: '$createdAt',
                                },
                            },
                        },
                        totalDealValue: {
                            $sum: '$dealSize',
                        },
                    },
                },
            ],
        ]).allowDiskUse(true);
        data.forEach((dayRecord) => {
            let dayDate = new Date(dayRecord._id.year, dayRecord._id.month - 1, dayRecord._id.day, 0, 0, 0);
            for (let j = 0; j < Object.keys(responseObj).length; j++) {
                if (
                    parseInt(Object.keys(responseObj)[j]) < dayDate.getTime() &&
                    (j === Object.keys(responseObj).length - 1 ||
                        parseInt(Object.keys(responseObj)[j + 1]) > dayDate.getTime())
                ) {
                    responseObj[Object.keys(responseObj)[j]] += dayRecord.totalDealValue;
                }
            }
        });
        let finalResponseArr = [];
        for (let i = 0; i < Object.keys(responseObj).length; i++) {
            const dateLabel = moment(new Date(parseInt(Object.keys(responseObj)[i]))).format('MMM DD');
            finalResponseArr.push({
                _id: dateLabel,
                totalDealSize: responseObj[Object.keys(responseObj)[i]],
            });
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: finalResponseArr,
        });
    } catch (e) {
        Logger.log.error('Error in client-reporting total sales API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

router.get('/conversions', async (req, res) => {
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
        let stages = ['INITIAL_CONTACT', 'IN_CONVERSION', 'MEETING_BOOKED', 'FOLLOW_UP', 'CLOSED', 'LOST', 'POTENTIAL'];
        stages.forEach((stage) => {
            if (addedStages.indexOf(stage) === -1) {
                data.push({
                    _id: stage,
                    total: 0,
                });
            }
        });
        let dataObj = {};
        data.forEach((dataElement) => {
            dataObj[dataElement._id] = dataElement.total;
        });
        let passedInitialContact =
            dataObj['INITIAL_CONTACT'] +
            dataObj['IN_CONVERSION'] +
            dataObj['MEETING_BOOKED'] +
            dataObj['FOLLOW_UP'] +
            dataObj['POTENTIAL'] +
            dataObj['LOST'] +
            dataObj['CLOSED'];
        let passedInConversion =
            dataObj['IN_CONVERSION'] +
            dataObj['MEETING_BOOKED'] +
            dataObj['FOLLOW_UP'] +
            dataObj['POTENTIAL'] +
            dataObj['LOST'] +
            dataObj['CLOSED'];
        let passedMeetingBooked =
            dataObj['MEETING_BOOKED'] +
            dataObj['FOLLOW_UP'] +
            dataObj['POTENTIAL'] +
            dataObj['LOST'] +
            dataObj['CLOSED'];
        let passedSale = dataObj['CLOSED'];
        let responseObj = {
            ar: 0,
            aToC: (passedInConversion / passedInitialContact) * 100,
            cToM: (passedMeetingBooked / passedInConversion) * 100,
            MToS: (passedSale / passedMeetingBooked) * 100,
        };

        return res.status(200).send({
            status: 'SUCCESS',
            data: responseObj,
        });
    } catch (e) {
        Logger.log.error('Error in client-reporting conversions API call', e.message || e);
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
