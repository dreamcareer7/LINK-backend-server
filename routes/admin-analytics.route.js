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
        let mod;
        let div;

        let opportunity = await Opportunity.find()
            .sort({ dealSize: -1 })
            .limit(1)
            .select('dealSize');
        maxDealValue = opportunity[0].dealSize;
        mod = maxDealValue % 7;
        maxDealValue = 7 - mod + maxDealValue;
        div = maxDealValue / 7;
        let concatArr = [];
        for (let i = 1; i <= 7; i++) {
            concatArr.push({
                $cond: [
                    {
                        $and: [{ $gte: ['$dealSize', div * i - div + 1] }, { $lte: ['$dealSize', div * i] }],
                    },
                    `${div * i - div + 1}-${div * i}`,
                    '',
                ],
            });
        }
        let dealValue = await Opportunity.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(req.body.startDate),
                        $lte: new Date(req.body.endDate),
                    },
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
        return res.status(200).send({
            status: 'SUCCESS',
            data: data,
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
                        'selectedPlan.planStartDate': {
                            $gte: new Date(req.body.startDate),
                            $lte: new Date(req.body.endDate),
                        },
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
                        updatedAt: {
                            $gte: new Date(req.body.startDate),
                            $lte: new Date(req.body.endDate),
                        },
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
                                updatedAt: {
                                    $gte: new Date(req.body.startDate),
                                    $lte: new Date(req.body.endDate),
                                },
                            },
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
