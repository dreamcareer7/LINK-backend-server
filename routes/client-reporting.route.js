const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Invitee = mongoose.model('invitee');
const Logger = require('../services/logger');
const graphHelper = require('../helper/graph.helper');

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
        endDate.setHours(23, 59, 59, 0);
        let promiseArr = [];
        promiseArr.push(
            Opportunity.aggregate([
                [
                    {
                        $match: {
                            clientId: req.client._id,
                            isDeleted: false,
                            // createdAt: { $gte: startDate, $lte: endDate },
                        },
                    },
                    {
                        $unwind: {
                            path: '$stageLogs',
                        },
                    },
                    {
                        $match: {
                            clientId: req.client._id,
                            isDeleted: false,
                            'stageLogs.changedAt': { $gte: startDate, $lte: endDate },
                        },
                    },
                    {
                        $group: {
                            _id: '$stageLogs.value',
                            totalUsers: {
                                $addToSet: '$_id',
                            },
                        },
                    },
                    {
                        $project: {
                            total: {
                                $size: '$totalUsers',
                            },
                        },
                    },
                ],
            ]).allowDiskUse(true),
        );
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
                        'invitees.sentAt': { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: 'INVITED',
                        total: {
                            $sum: 1,
                        },
                    },
                },
            ]),
        );
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
                        'invitees.isAccepted': true,
                        'invitees.acceptedAt': { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: 'ACCEPTED',
                        total: {
                            $sum: 1,
                        },
                    },
                },
            ]),
        );
        let responses = await Promise.all(promiseArr);
        let data = responses[0];
        let invitedData = responses[1];
        let acceptedData = responses[2];
        if (invitedData.length === 0) {
            invitedData = [
                {
                    _id: 'INVITED',
                    total: 0,
                },
            ];
        }
        if (acceptedData.length === 0) {
            acceptedData = [
                {
                    _id: 'ACCEPTED',
                    total: 0,
                },
            ];
        }
        data = [...data, ...invitedData, ...acceptedData];
        let addedStages = data.map((stage) => stage._id.toString());
        let stages = ['INVITED', 'ACCEPTED', 'IN_CONVERSION', 'MEETING_BOOKED', 'CLOSED', 'LOST'];
        stages.forEach((stage) => {
            if (addedStages.indexOf(stage) === -1) {
                data.push({
                    _id: stage,
                    total: 0,
                });
            }
        });
        let stageMap = {
            INVITED: 'INVITED',
            ACCEPTED: 'ACCEPTED',
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
        endDate.setHours(23, 59, 59, 0);
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
        let totalDealAmount = 0;
        data = data.filter(function(value, index, arr) {
            return value._id !== null;
        });
        if (data.length === 0) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: [],
            });
        }
        let addedPipelines = data.map((pipeline) => pipeline._id);
        let pipelines = ['VERY_LIKELY', 'LIKELY', 'NOT_LIKELY'];
        pipelines.forEach((pipeline) => {
            if (addedPipelines.indexOf(pipeline) === -1) {
                data.push({
                    _id: pipeline,
                    total: 0,
                    totalDealValue: 0,
                });
            }
        });
        data.forEach((pipeline) => {
            totalDealAmount += pipeline.totalDealValue;
            pipeline.totalDealValueStr = graphHelper.getDealValueStr(pipeline.totalDealValue);
        });
        data.forEach((pipeline) => {
            pipeline.totalDealValuePer = graphHelper.getPercentStr(pipeline.totalDealValue, totalDealAmount);
        });
        let orderedData = [];
        pipelines.forEach((key) => {
            orderedData.push(data.filter((pipeline) => pipeline._id === key).pop());
        });
        return res.status(200).send({
            status: 'SUCCESS',
            data: orderedData,
            totalDealAmount,
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
        endDate.setHours(23, 59, 59, 0);
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
                        // createdAt: { $gte: startDate, $lte: endDate },
                        // stage: 'CLOSED',
                    },
                },
                {
                    $unwind: {
                        path: '$stageLogs',
                    },
                },
                {
                    $match: {
                        'stageLogs.value': 'CLOSED',
                        'stageLogs.changedAt': { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        changedAt: {
                            $last: '$stageLogs.changedAt',
                        },
                        dealSize: {
                            $last: '$dealSize',
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            month: {
                                $month: {
                                    date: '$changedAt',
                                },
                            },
                            day: {
                                $dayOfMonth: {
                                    date: '$changedAt',
                                },
                            },
                            year: {
                                $year: {
                                    date: '$changedAt',
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
        let maximumDeal = 0;
        data.forEach((dayRecord) => {
            if (maximumDeal < dayRecord.totalDealValue) {
                maximumDeal = dayRecord.totalDealValue;
            }
            let dayDate = new Date(dayRecord._id.year, dayRecord._id.month - 1, dayRecord._id.day, 0, 0, 0);
            for (let j = 0; j < Object.keys(responseObj).length; j++) {
                if (
                    parseInt(Object.keys(responseObj)[j]) <= dayDate.getTime() &&
                    (j === Object.keys(responseObj).length - 1 ||
                        parseInt(Object.keys(responseObj)[j + 1]) > dayDate.getTime())
                ) {
                    responseObj[Object.keys(responseObj)[j]] += dayRecord.totalDealValue;
                }
            }
        });
        let maximumGraphValue = Math.pow(10, maximumDeal.toFixed(0).length);
        let dividerValues = 0;
        if (maximumGraphValue) dividerValues = maximumGraphValue / 5;
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
            maximumGraphValue,
            dividerValues,
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
        endDate.setHours(23, 59, 59, 0);
        let promiseArr = [];
        promiseArr.push(
            Opportunity.aggregate([
                [
                    {
                        $match: {
                            clientId: req.client._id,
                            isDeleted: false,
                            // createdAt: { $gte: startDate, $lte: endDate },
                        },
                    },
                    {
                        $unwind: {
                            path: '$stageLogs',
                        },
                    },
                    {
                        $match: {
                            clientId: req.client._id,
                            isDeleted: false,
                            'stageLogs.changedAt': { $gte: startDate, $lte: endDate },
                        },
                    },
                    {
                        $group: {
                            _id: '$stageLogs.value',
                            total: {
                                $sum: 1,
                            },
                        },
                    },
                ],
            ]).allowDiskUse(true),
        );
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
                        'invitees.sentAt': { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: 'INVITED',
                        total: {
                            $sum: 1,
                        },
                    },
                },
            ]),
        );
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
                        'invitees.isAccepted': true,
                        'invitees.acceptedAt': { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: 'ACCEPTED',
                        total: {
                            $sum: 1,
                        },
                    },
                },
            ]),
        );
        let responses = await Promise.all(promiseArr);
        let data = responses[0];
        let invitedData = responses[1];
        let acceptedData = responses[2];
        let invitedCount = invitedData.length !== 0 ? invitedData[0].total : 0;
        let acceptedCount = acceptedData.length !== 0 ? acceptedData[0].total : 0;
        let ar = 0;
        if (invitedCount !== 0) {
            ar = Math.round((acceptedCount / invitedCount) * 10000) / 100;
        }
        data = data.filter(function(value, index, arr) {
            return value._id !== null;
        });
        let addedStages = data.map((stage) => stage._id);
        let stages = ['INITIAL_CONTACT', 'IN_CONVERSION', 'MEETING_BOOKED', 'CLOSED'];
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
        let passedInitialContact = dataObj['INITIAL_CONTACT'];
        let passedInConversion = dataObj['IN_CONVERSION'];
        let passedMeetingBooked = dataObj['MEETING_BOOKED'];
        let passedSale = dataObj['CLOSED'];
        let responseObj = {
            ar: ar,
            aToC: Math.round((passedInConversion / passedInitialContact) * 10000) / 100,
            cToM: Math.round((passedMeetingBooked / passedInConversion) * 10000) / 100,
            MToS: Math.round((passedSale / passedMeetingBooked) * 10000) / 100,
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
