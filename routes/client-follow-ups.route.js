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
        let and = [];
        if (req.body.stages.length > 0) {
            let or = [];
            for (i = 0; i < req.body.stages.length; i++) {
                or.push({
                    stage: req.body.stages[i],
                });
            }
            and.push({
                $or: or,
            });
        }

        if (req.body.likelyHoods.length > 0) {
            let or = [];
            for (i = 0; i < req.body.likelyHoods.length; i++) {
                or.push({
                    likelyHood: req.body.likelyHoods[i],
                });
            }
            and.push({
                $or: or,
            });
        }
        if (req.body.dealSize) {
            and.push({
                dealSize: req.body.dealSize,
            });
        }
        if (req.body.endDate && req.body.startDate) {
            and.push({
                createdAt: {
                    $gte: new Date(req.body.startDate),
                    $lte: new Date(req.body.endDate),
                },
            });
        }
        if (and.length == 0) {
            and.push({});
        }
        let opportunities = await Opportunity.find({ clientId: req.client._id, isDeleted: false, $and: and });
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
