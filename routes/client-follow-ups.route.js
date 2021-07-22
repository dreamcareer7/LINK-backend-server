const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Opportunity = mongoose.model('opportunity');
const Logger = require('../services/logger');

/**
 *client-follow-ups filters
 */

router.put('/filters', async (req, res) => {
    try {
        let momentDate = moment().tz('Australia/Melbourne');
        momentDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        momentDate.toISOString();
        momentDate = momentDate.format();
        let today = momentDate;
        let options = {
            page: parseInt(req.query.page),
            limit: parseInt(req.query.limit),
            sort: { followUp: 1, firstName: 1, lastName: 1 },
        };
        let queryObj = {
            clientId: req.client._id,
            isDeleted: false,
            isSaved: true,
            followUp: { $exists: true, $ne: null },
        };

        if (req.body.stages.length > 0) {
            let otherStages = req.body.stages;
            let lostClosedStages = [];
            if (otherStages.indexOf('LOST') === -1) {
                lostClosedStages.push('LOST');
            }
            if (otherStages.indexOf('CLOSED') === -1) {
                lostClosedStages.push('CLOSED');
            }
            queryObj.stage = { $in: req.body.stages, $nin: [] };
            queryObj['$or'] = [
                { stage: { $in: lostClosedStages }, followUp: { $gte: today } },
                { stage: { $in: otherStages } },
            ];
        } else {
            queryObj['$or'] = [
                { stage: { $in: ['CLOSED', 'LOST'] }, followUp: { $gte: today } },
                { stage: { $in: ['INITIAL_CONTACT', 'IN_CONVERSION', 'MEETING_BOOKED', 'FOLLOW_UP', 'POTENTIAL'] } },
            ];
        }
        if (req.body.likelyHoods.length > 0) {
            queryObj.likelyHood = { $in: req.body.likelyHoods };
        }
        if (req.body.startDeal && req.body.endDeal) {
            queryObj.dealSize = {
                $gte: req.body.startDeal,
                $lte: req.body.endDeal,
            };
        }
        if (req.body.endDate && req.body.startDate) {
            queryObj.followUp = {
                $gte: new Date(req.body.startDate),
                $lte: new Date(req.body.endDate),
            };
        }
        // console.log('today::', today);
        // console.log('queryObj::', JSON.stringify(queryObj, null, 3));
        let promiseArr = [];
        promiseArr.push(Opportunity.paginate(queryObj, options));
        promiseArr.push(
            Opportunity.aggregate([
                {
                    $match: {
                        $and: [{ clientId: req.client._id }, { isDeleted: false, isSaved: true }],
                    },
                },
                {
                    $group: {
                        _id: null,
                        maxDealValue: { $max: '$dealSize' },
                        minDealValue: { $min: '$dealSize' },
                    },
                },
            ]).allowDiskUse(true),
        );
        let data = await Promise.all(promiseArr);
        if (
            data[1][0] &&
            data[1][0].minDealValue &&
            data[1][0].maxDealValue &&
            data[1][0].minDealValue === data[1][0].maxDealValue
        )
            data[1][0].minDealValue = 0;
        res.status(200).send({
            status: 'SUCCESS',
            data: {
                docs: data[0],
                dealSize: data[1],
            },
        });
    } catch (e) {
        Logger.log.error('Error client-follow-ups filters in  API.', e.message || e);
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
