const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Invitee = mongoose.model('invitee');
const Logger = require('../services/logger');
const graphHelper = require('../helper/graph.helper');

router.put('/general-values', async (req, res) => {
    try {
        let promiseArr = [];
        promiseArr.push(getInvitesValues({ clientId: req.client._id }));
        promiseArr.push(getTotalLeads({ clientId: req.client._id }));
        promiseArr.push(getTotalHoursSpent({ client: req.client }));
        promiseArr.push(getPercentOfLeadsClosed({ clientId: req.client._id }));
        promiseArr.push(getTotalSalesGenerated({ clientId: req.client._id }));
        let promiseData = await Promise.all(promiseArr);
        let responseData = {};
        promiseData.forEach((response) => {
            responseData = { ...responseData, ...response };
        });
        console.log('responseData', responseData);
        return res.status(200).send({
            status: 'SUCCESS',
            data: responseData,
        });
    } catch (e) {
        Logger.log.error('Error in client-dashboard-updated general values API call', e.message || e);
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
                        $and: [{ clientId: req.client._id }, { isDeleted: false, isSaved: true }],
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
        Logger.log.error('Error in client-dashboard-updated pipeline-value API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

router.put('/sales-between', async (req, res) => {
    try {
        let startDate = req.body.startDate;
        let endDate = req.body.endDate;
        let salesGenerated = 0;
        let aggregationArr = [
            {
                $match: {
                    clientId: req.client._id,
                    isDeleted: false,
                    isSaved: true,
                    stage: 'CLOSED',
                },
            },
            {
                $project: {
                    lastChangedAt: {
                        $last: '$stageLogs.changedAt',
                    },
                    dealSize: '$dealSize',
                },
            },
        ];
        if (startDate && endDate) {
            aggregationArr.push({
                $match: {
                    lastChangedAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            });
        }
        aggregationArr.push({
            $group: {
                _id: null,
                salesGenerated: {
                    $sum: '$dealSize',
                },
            },
        });
        let data = await Opportunity.aggregate(aggregationArr).allowDiskUse(true);
        if (data && data.length !== 0) {
            salesGenerated = data[0].salesGenerated;
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: { salesGenerated },
        });
    } catch (e) {
        Logger.log.error('Error in client-dashboard-updated sales-generated API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

let getTotalHoursSpent = ({ client }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let hoursSpent = 0;
            if (client.timeSpentOnLinkedInInMs) {
                Logger.log.info('Time spent on linkedIn in  ms:', client.timeSpentOnLinkedInInMs);
                hoursSpent = Math.round(client.timeSpentOnLinkedInInMs / (60 * 60 * 1000));
            }
            return resolve({
                timeSpentInLinkedIn: hoursSpent,
            });
        } catch (err) {
            Logger.log.error('ERROR : ', err);
            reject(err);
        }
    });
};

let getInvitesValues = ({ clientId }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let inviteSent = 0;
            let inviteAccepted = 0;
            let acceptanceRate = 0;
            let inviteesData = await Invitee.aggregate([
                {
                    $match: {
                        clientId: clientId,
                        isDeleted: false,
                    },
                },
                {
                    $unwind: {
                        path: '$invitees',
                    },
                },
                {
                    $group: {
                        _id: {
                            isAccepted: '$invitees.isAccepted',
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]);
            console.log('inviteesData::', inviteesData);
            for (let i = 0; i < inviteesData.length; i++) {
                if (inviteesData[i]._id.hasOwnProperty('isAccepted') && !inviteesData[i]._id.isAccepted) {
                    inviteSent = inviteesData[i].count;
                } else if (inviteesData[i]._id.hasOwnProperty('isAccepted') && inviteesData[i]._id.isAccepted) {
                    inviteAccepted = inviteesData[i].count;
                }
            }
            inviteSent += inviteAccepted;
            console.log('inviteSent::', inviteSent);
            console.log('inviteAccepted::', inviteAccepted);
            if (inviteSent !== 0 || inviteSent !== 0) {
                acceptanceRate = Math.round((inviteAccepted / (inviteSent + inviteAccepted)) * 100);
            }
            console.log('acceptanceRate::', acceptanceRate);
            return resolve({
                inviteSent,
                inviteAccepted,
                acceptanceRate,
            });
        } catch (err) {
            Logger.log.error('ERROR : ', err);
            reject(err);
        }
    });
};

let getTotalLeads = ({ clientId }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let opportunityCount = await Opportunity.find({
                isDeleted: false,
                isSaved: true,
                clientId: clientId,
                stage: { $nin: ['CLOSED', 'LOST'], $exists: true },
            }).count();
            console.log('opportunityCount::', opportunityCount);
            resolve({ opportunityCount });
        } catch (err) {
            Logger.log.error('ERROR : ', err);
            reject(err);
        }
    });
};

let getPercentOfLeadsClosed = ({ clientId }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let closed = 0;
            let otherThanClosed = 0;
            let percentOfLeadsClosed = 0;
            let opportunityData = await Opportunity.aggregate([
                {
                    $match: {
                        clientId: clientId,
                        isDeleted: false,
                        isSaved: true,
                        stage: {
                            $exists: true,
                        },
                    },
                },
                {
                    $project: {
                        isClosed: {
                            $cond: {
                                if: {
                                    $eq: ['$stage', 'CLOSED'],
                                },
                                then: true,
                                else: false,
                            },
                        },
                        stage: '$stage',
                    },
                },
                {
                    $group: {
                        _id: {
                            isClosed: '$isClosed',
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]);
            for (let i = 0; i < opportunityData.length; i++) {
                if (opportunityData[i]._id.hasOwnProperty('isClosed') && opportunityData[i]._id.isClosed) {
                    closed = opportunityData[i].count;
                } else if (opportunityData[i]._id.hasOwnProperty('isClosed') && !opportunityData[i]._id.isClosed) {
                    otherThanClosed = opportunityData[i].count;
                }
            }
            console.log('closed::', closed);
            console.log('otherThanClosed::', otherThanClosed);
            if (closed !== 0 || otherThanClosed !== 0) {
                percentOfLeadsClosed = Math.round((closed / (closed + otherThanClosed)) * 100);
            }
            console.log('percentOfLeadsClosed::', percentOfLeadsClosed);
            return resolve({ percentOfLeadsClosed });
        } catch (err) {
            Logger.log.error('ERROR : ', err);
            reject(err);
        }
    });
};

let getTotalSalesGenerated = ({ clientId }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let totalSalesGenerated = 0;
            let opportunityData = await Opportunity.aggregate([
                {
                    $match: {
                        clientId: clientId,
                        isDeleted: false,
                        isSaved: true,
                        stage: 'CLOSED',
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSales: {
                            $sum: '$dealSize',
                        },
                    },
                },
            ]);
            for (let i = 0; i < opportunityData.length; i++) {
                if (opportunityData[i].hasOwnProperty('totalSales')) {
                    totalSalesGenerated += opportunityData[i].totalSales;
                }
            }
            return resolve({ totalSalesGenerated });
        } catch (err) {
            Logger.log.error('ERROR : ', err);
            reject(err);
        }
    });
};

/**
 * Export Router
 */
module.exports = router;
