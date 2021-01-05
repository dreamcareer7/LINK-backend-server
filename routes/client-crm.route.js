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
            stage: req.body.stage,
            clientId: req.client._id,
            isDeleted: false,
        };

        if (req.body.endDate && req.body.startDate) {
            queryObj.createdAt = {
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
        if (req.body.location) {
            queryObj.location = { $regex: req.body.location, $options: 'i' };
        }

        if (req.body.likelyHoods.length > 0) {
            queryObj.likelyHood = { $in: req.body.likelyHoods };
        }

        let opportunities = await Opportunity.paginate(queryObj, { page, limit });

        res.status(200).send({
            status: 'SUCCESS',
            data: opportunities,
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
