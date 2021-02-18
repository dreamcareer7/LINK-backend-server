const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Opportunity = mongoose.model('opportunity');
const Organization = mongoose.model('organization');
const Logger = require('../services/logger');
const config = require('../config');

router.put('/deal-value', async (req, res) => {
    try {
        if (!req.body.endDate || !req.body.startDate || !req.body.selectedPlan) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Required field is missing',
            });
        }
        req.body.startDate = new Date(req.body.startDate);
        req.body.endDate = new Date(req.body.endDate);
        req.body.startDate.setHours(0, 0, 0, 0);
        req.body.endDate.setHours(23, 59, 59, 0);

        let concatArr = [
            {
                $cond: [
                    {
                        $and: [{ $gte: ['$dealSize', 1] }, { $lte: ['$dealSize', 100] }],
                    },
                    `0`,
                    '',
                ],
            },
            {
                $cond: [
                    {
                        $and: [{ $gte: ['$dealSize', 101] }, { $lte: ['$dealSize', 500] }],
                    },
                    `1`,
                    '',
                ],
            },
            {
                $cond: [
                    {
                        $and: [{ $gte: ['$dealSize', 501] }, { $lte: ['$dealSize', 1000] }],
                    },
                    `2`,
                    '',
                ],
            },
            {
                $cond: [
                    {
                        $and: [{ $gte: ['$dealSize', 1001] }, { $lte: ['$dealSize', 5000] }],
                    },
                    `3`,
                    '',
                ],
            },
            {
                $cond: [
                    {
                        $and: [{ $gte: ['$dealSize', 5001] }, { $lte: ['$dealSize', 10000] }],
                    },
                    `4`,
                    '',
                ],
            },
            {
                $cond: [
                    {
                        $and: [{ $gte: ['$dealSize', 10001] }, { $lte: ['$dealSize', 20000] }],
                    },
                    `5`,
                    '',
                ],
            },
            {
                $cond: [
                    {
                        $and: [{ $gte: ['$dealSize', 20001] }],
                    },
                    `6`,
                    '',
                ],
            },
        ];
        let dealValue = await Opportunity.aggregate([
            {
                $match: {
                    $and: [
                        {
                            createdAt: {
                                $gte: req.body.startDate,
                                $lte: req.body.endDate,
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
        if (dealValue.length === 0) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: [],
            });
        }
        let addedDealValues = dealValue.map((value) => value._id);
        if (addedDealValues.length === 0) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: [],
            });
        }
        let dealSizeMap = {
            '0': '$1 - $100',
            '1': '$101 - $500',
            '2': '$501 - $1,000',
            '3': '$1,001 - $5,000',
            '4': '$5,001 - $10,000',
            '5': '$10,001 - $20,000',
            '6': '$20,000 +',
        };
        Object.keys(dealSizeMap).forEach((key) => {
            if (addedDealValues.indexOf(key) === -1) {
                dealValue.push({
                    _id: key,
                    total: 0,
                });
            }
        });
        dealValue.sort((a, b) => {
            return parseInt(a._id) - parseInt(b._id);
        });
        dealValue.forEach((value) => {
            value._id = dealSizeMap[value._id];
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
        req.body.startDate = new Date(req.body.startDate);
        req.body.endDate = new Date(req.body.endDate);
        req.body.startDate.setHours(0, 0, 0, 0);
        req.body.endDate.setHours(23, 59, 59, 0);
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
                                    $gte: req.body.startDate,
                                    $lte: req.body.endDate,
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
        req.body.startDate = new Date(req.body.startDate);
        req.body.endDate = new Date(req.body.endDate);
        req.body.startDate.setHours(0, 0, 0, 0);
        req.body.endDate.setHours(23, 59, 59, 0);
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
                                    $gte: req.body.startDate,
                                    $lte: req.body.endDate,
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
        data = data.filter(function(value, index, arr) {
            return value._id !== null;
        });
        let addedGenders = data.map((gender) => gender._id);
        if (addedGenders.length === 0) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: [],
            });
        }
        let genders = ['MALE', 'FEMALE', 'OTHER'];
        genders.forEach((gender) => {
            if (addedGenders.indexOf(gender) === -1) {
                data.push({
                    _id: gender,
                    total: 0,
                });
            }
        });
        let genderMap = {
            MALE: 'Male',
            FEMALE: 'Female',
            OTHER: 'Other',
        };
        let orderedData = [];
        Object.keys(genderMap).forEach((key) => {
            orderedData.push(data.filter((gender) => gender._id === key).pop());
        });
        for (let i = 0; i < orderedData.length; i++) {
            orderedData[i]._id = genderMap[orderedData[i]._id];
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: orderedData,
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
        req.body.startDate = new Date(req.body.startDate);
        req.body.endDate = new Date(req.body.endDate);
        req.body.startDate.setHours(0, 0, 0, 0);
        req.body.endDate.setHours(23, 59, 59, 0);
        let data = await Client.aggregate([
            [
                {
                    $match: {
                        $and: [
                            {
                                'selectedPlan.startDate': {
                                    $gte: req.body.startDate,
                                    $lte: req.body.endDate,
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
        // let data = await Client.aggregate([
        //     [
        //         {
        //             $match: {
        //                 $and: [
        //                     {
        //                         'selectedPlan.startDate': {
        //                             $gte: req.body.startDate,
        //                             $lte: req.body.endDate,
        //                         },
        //                     },
        //                     { isDeleted: false },
        //                 ],
        //             },
        //         },
        //         {
        //             $project: {
        //                 groupTo: {
        //                     $cond: {
        //                         if: {
        //                             $eq: ['$vicSub', true],
        //                         },
        //                         then: 'VIC',
        //                         else: '$selectedPlan.status',
        //                     },
        //                 },
        //             },
        //         },
        //         {
        //             $group: {
        //                 _id: '$groupTo',
        //                 total: {
        //                     $sum: 1,
        //                 },
        //             },
        //         },
        //     ],
        // ]).allowDiskUse(true);
        let addedPlans = data.map((plan) => plan._id);
        if (addedPlans.length === 0) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: [],
            });
        }
        let plans = ['FREE_TRIAL', 'MONTHLY', 'YEARLY', 'CANCELLED'];
        plans.forEach((plan) => {
            if (addedPlans.indexOf(plan) === -1) {
                data.push({
                    _id: plan,
                    total: 0,
                });
            }
        });
        let orderedData = [];
        plans.forEach((totalPlan) => {
            orderedData.push(data.filter((plan) => plan._id === totalPlan).pop());
        });
        for (let i = 0; i < orderedData.length; i++) {
            orderedData[i]._id = getPlanStr(orderedData[i]._id);
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: orderedData,
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
        if (!req.body.endDate || !req.body.startDate || !req.body.selectedPlan) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Required field is missing',
            });
        }
        req.body.startDate = new Date(req.body.startDate);
        req.body.endDate = new Date(req.body.endDate);
        req.body.startDate.setHours(0, 0, 0, 0);
        req.body.endDate.setHours(23, 59, 59, 0);
        let data = await Opportunity.aggregate([
            [
                {
                    $match: {
                        $and: [
                            // {
                            //     'selectedPlan.status': req.body.selectedPlan,
                            // },
                            {
                                updatedAt: {
                                    $gte: req.body.startDate,
                                    $lte: req.body.endDate,
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
        let addedStages = data.map((stage) => stage._id);
        if (addedStages.length === 0) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: [],
            });
        }
        let stages = ['INITIAL_CONTACT', 'IN_CONVERSION', 'MEETING_BOOKED', 'FOLLOW_UP', 'POTENTIAL', 'CLOSED', 'LOST'];
        stages.forEach((stage) => {
            if (addedStages.indexOf(stage) === -1) {
                data.push({
                    _id: stage,
                    total: 0,
                });
            }
        });
        let stageMap = {
            INITIAL_CONTACT: 'Initial Contact',
            IN_CONVERSION: 'In Conversation',
            POTENTIAL: 'Potential Deals',
            FOLLOW_UP: 'Follow Up',
            MEETING_BOOKED: 'Meeting Booked',
            CLOSED: 'Closed',
            LOST: 'Lost',
        };
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
        req.body.startDate = new Date(req.body.startDate);
        req.body.endDate = new Date(req.body.endDate);
        req.body.startDate.setHours(0, 0, 0, 0);
        req.body.endDate.setHours(23, 59, 59, 0);
        let promiseArr = [];
        let aggregationPipeline = [
            [
                {
                    $match: {
                        $and: [
                            {
                                'selectedPlan.status': req.body.selectedPlan,
                            },
                            {
                                createdAt: {
                                    $gte: req.body.startDate,
                                    $lte: req.body.endDate,
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
        ];
        promiseArr.push(Client.aggregate(aggregationPipeline).allowDiskUse(true));
        promiseArr.push(
            Organization.findOne({
                organizationId: config.organization.organizationId,
            })
                .select({ companySize: 1 })
                .lean(),
        );
        let responses = await Promise.all(promiseArr);
        let data = responses[0];
        data = data.filter(function(value, index, arr) {
            return value._id !== null;
        });
        let allSizes = responses[1].companySize;
        let addedSizes = data.map((size) => size._id);
        if (addedSizes.length === 0) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: [],
            });
        }
        allSizes.forEach((size) => {
            if (addedSizes.indexOf(size) === -1) {
                data.push({
                    _id: size,
                    total: 0,
                });
            }
        });

        data.sort((a, b) => {
            return (
                a._id
                    .split('-')
                    .pop()
                    .replace(/[,+]/gi, '') -
                b._id
                    .split('-')
                    .pop()
                    .replace(/[,+]/gi, '')
            );
        });
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

let getPlanStr = (plan) => {
    switch (plan) {
        case 'FREE_TRIAL':
            return 'Free Trial';
        case 'MONTHLY':
            return 'Monthly';
        case 'YEARLY':
            return 'Yearly';
        case 'VIC':
            return 'VIC';
        case 'CANCELLED':
            return 'Cancelled';
    }
};

/**
 * Export Router
 */
module.exports = router;
