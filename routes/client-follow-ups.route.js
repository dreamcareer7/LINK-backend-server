const { json } = require('body-parser');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Logger = require('../services/logger');

/**
 *client-follow-ups filters
 */

router.put('/filters', async (req, res) => {
    try {
        let queryObj = {
            clientId: req.client._id,
            isDeleted: false,
        };

        if (req.body.stages.length > 0) {
            queryObj.stage = { $in: req.body.stages };
        }

        if (req.body.likelyHoods.length > 0) {
            queryObj.likelyHood = { $in: req.body.likelyHoods };
        }
        if (req.body.dealSize) {
            queryObj.dealSize = req.body.dealSize;
        }
        if (req.body.endDate && req.body.startDate) {
            queryObj.createdAt = {
                $gte: new Date(req.body.startDate),
                $lte: new Date(req.body.endDate),
            };
        }

        let opportunities = await Opportunity.find(queryObj);
        res.status(200).send({
            status: 'SUCCESS',
            data: opportunities,
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
