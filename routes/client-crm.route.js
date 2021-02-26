const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Logger = require('../services/logger');
/**
 * client-crm filters
 */
router.put('/filters', async (req, res) => {
    try {
        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);
        let queryObj = {
            clientId: req.client._id,
            isDeleted: false,
        };

        if (req.body.endDate && req.body.startDate) {
            queryObj.followUp = {
                $gte: new Date(req.body.startDate),
                $lte: new Date(req.body.endDate),
            };
        }
        if (req.body.startDeal && req.body.endDeal) {
            queryObj.dealSize = {
                $gte: req.body.startDeal,
                $lte: req.body.endDeal,
            };
        }
        if (req.body.stage) {
            queryObj.stage = req.body.stage;
        }
        if (req.body.location) {
            queryObj.location = { $regex: req.body.location, $options: 'i' };
        }

        if (req.body.likelyHoods && req.body.likelyHoods.length > 0) {
            queryObj.likelyHood = { $in: req.body.likelyHoods };
        }

        let promiseArr = [];
        promiseArr.push(Opportunity.paginate(queryObj, { page, limit }));
        promiseArr.push(
            Opportunity.aggregate([
                {
                    $match: {
                        $and: [{ clientId: req.client._id }, { isDeleted: false }],
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
        Logger.log.error('Error client-crm filters in  API.', e.message || e);
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
