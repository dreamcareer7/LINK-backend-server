const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Opportunity = mongoose.model('opportunity');
const Logger = require('../services/logger');

router.put('/deal-value', async (req, res) => {
    try {
        if (!req.body.endDate || !req.body.startDate) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Required field is missing',
            });
        }
        let maxDealValue;
        let minDealValue;
        let dealRange = await Opportunity.aggregate([
            {
                $match: {
                    $and: [
                        {
                            createdAt: {
                                $gte: new Date(req.body.startDate),
                                $lte: new Date(req.body.endDate),
                            },
                        },
                        { isDeleted: false },
                    ],
                },
            },
            {
                $group: {
                    _id: null,
                    maxDealValue: { $max: '$dealSize' },
                    minDealValue: { $min: '$dealSize' },
                },
            },
        ]).allowDiskUse(true);

        if (dealRange.length === 0) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: dealRange,
            });
        }

        maxDealValue = Math.ceil(dealRange[0].maxDealValue);
        minDealValue = Math.floor(dealRange[0].minDealValue);

        let a = minDealValue;
        let b = Math.pow(maxDealValue / minDealValue, 1 / 7);

        let dealRangeArr = [];
        for (let i = 0; i <= 7; i++) {
            dealRangeArr.push(Math.ceil(a * Math.pow(b, i)));
        }

        let concatArr = [];

        for (let i = 0; i <= 7; i++) {
            if (i === 0) {
                concatArr.push({
                    $cond: [
                        {
                            $and: [
                                { $gte: ['$dealSize', dealRangeArr[i]] },
                                { $lte: ['$dealSize', dealRangeArr[i + 1]] },
                            ],
                        },
                        `${dealRangeArr[i]}-${dealRangeArr[i + 1]}`,
                        '',
                    ],
                });
            } else {
                concatArr.push({
                    $cond: [
                        {
                            $and: [
                                { $gte: ['$dealSize', dealRangeArr[i] + 1] },
                                { $lte: ['$dealSize', dealRangeArr[i + 1]] },
                            ],
                        },
                        `${dealRangeArr[i] + 1}-${dealRangeArr[i + 1]}`,
                        '',
                    ],
                });
            }
        }
        concatArr.pop();
        let dealValue = await Opportunity.aggregate([
            {
                $match: {
                    $and: [
                        {
                            createdAt: {
                                $gte: new Date(req.body.startDate),
                                $lte: new Date(req.body.endDate),
                            },
                        },
                        { isDeleted: false },
                    ],
                },
            },
            {
                $project: {
                    range: {
                        $concat: concatArr,
                    },
                },
            },
            {
                $group: {
                    _id: '$range',
                    total: {
                        $sum: 1,
                    },
                },
            },
        ]).allowDiskUse(true);
        dealValue = dealValue.filter(function(value, index, arr) {
            return value._id !== '';
        });
        dealValue.sort((a, b) => {
            return a._id.split('-').pop() - b._id.split('-').pop();
        });

        return res.status(200).send({
            status: 'SUCCESS',
            data: dealValue,
        });
    } catch (e) {
        Logger.log.error('Error in  deal-value admin analytics call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.put('/industries', async (req, res) => {
    try {
        if (!req.body.startDate || !req.body.endDate || !req.body.selectedPlan) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Required field is missing',
            });
        }
        let data = await Client.aggregate([
            [
                {
                    $match: {
                        $and: [
                            {
                                'selectedPlan.status': req.body.selectedPlan,
                            },
                            {
                                createdAt: {
                                    $gte: new Date(req.body.startDate),
                                    $lte: new Date(req.body.endDate),
                                },
                            },
                            {
                                isDeleted: false,
                            },
                        ],
                    },
                },
                {
                    $group: {
                        _id: '$industry',
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
        data.sort(function(a, b) {
            return b.total - a.total;
        });
        return res.status(200).send({
            status: 'SUCCESS',
            data: data.slice(0, 10),
        });
    } catch (e) {
        Logger.log.error('Error in industries  admin analytics call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.put('/gender', async (req, res) => {
    try {
        if (!req.body.selectedPlan || !req.body.endDate || !req.body.startDate) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Required field is missing',
            });
        }
        let data = await Client.aggregate([
            [
                {
                    $match: {
                        $and: [
                            {
                                'selectedPlan.status': req.body.selectedPlan,
                            },
                            {
                                createdAt: {
                                    $gte: new Date(req.body.startDate),
                                    $lte: new Date(req.body.endDate),
                                },
                            },
                            { isDeleted: false },
                        ],
                    },
                },
                {
                    $group: {
                        _id: '$gender',
                        total: {
                            $sum: 1,
                        },
                    },
                },
            ],
        ]).allowDiskUse(true);
        return res.status(200).send({
            status: 'SUCCESS',
            data: data,
        });
    } catch (e) {
        Logger.log.error('Error in gender  admin analytics call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.put('/subscription', async (req, res) => {
    try {
        if (!req.body.endDate || !req.body.startDate) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Required field is missing',
            });
        }
        let data = await Client.aggregate([
            [
                {
                    $match: {
                        $and: [
                            {
                                'selectedPlan.planStartDate': {
                                    $gte: new Date(req.body.startDate),
                                    $lte: new Date(req.body.endDate),
                                },
                            },
                            { isDeleted: false },
                        ],
                    },
                },
                {
                    $group: {
                        _id: '$selectedPlan.status',
                        total: {
                            $sum: 1,
                        },
                    },
                },
            ],
        ]).allowDiskUse(true);
        return res.status(200).send({
            status: 'SUCCESS',
            data: data,
        });
    } catch (e) {
        Logger.log.error('Error in subscription admin analytics call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.put('/opportunities', async (req, res) => {
    try {
        if (!req.body.endDate || !req.body.startDate) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Required field is missing',
            });
        }
        let data = await Opportunity.aggregate([
            [
                {
                    $match: {
                        $and: [
                            {
                                updatedAt: {
                                    $gte: new Date(req.body.startDate),
                                    $lte: new Date(req.body.endDate),
                                },
                            },
                            { isDeleted: false },
                        ],
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

        return res.status(200).send({
            status: 'SUCCESS',
            data: data,
        });
    } catch (e) {
        Logger.log.error('Error in opportunities  admin analytics call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.put('/company-size', async (req, res) => {
    try {
        if (!req.body.selectedPlan || !req.body.endDate || !req.body.startDate) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Required field is missing',
            });
        }
        console.log(req.body.selectedPlan, req.body.endDate, req.body.startDate);
        let data = await Client.aggregate([
            [
                {
                    $match: {
                        $and: [
                            {
                                'selectedPlan.status': req.body.selectedPlan,
                            },
                            {
                                createdAt: {
                                    $gte: new Date(req.body.startDate),
                                    $lte: new Date(req.body.endDate),
                                },
                            },
                            { isDeleted: false },
                        ],
                    },
                },
                {
                    $group: {
                        _id: '$companySize',
                        total: {
                            $sum: 1,
                        },
                    },
                },
            ],
        ]).allowDiskUse(true);
        return res.status(200).send({
            status: 'SUCCESS',
            data: data,
        });
    } catch (e) {
        Logger.log.error('Error in company-size admin analytics call', e.message || e);
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
