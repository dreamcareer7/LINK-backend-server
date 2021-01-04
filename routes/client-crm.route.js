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
        let and = [{ stage: req.body.stage }];
        if (req.body.endDate && req.body.startDate) {
            and.push({
                createdAt: {
                    $gte: new Date(req.body.startDate),
                    $lte: new Date(req.body.endDate),
                },
            });
        }
        if (req.body.startDeal && req.body.endDeal) {
            and.push({
                dealSize: {
                    $gte: req.body.startDeal,
                    $lte: req.body.endDeal,
                },
            });
        }
        if (req.body.location) {
            and.push({
                location: { $regex: req.body.location, $options: 'i' },
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

        let opportunities = await Opportunity.find({ clientId: req.client._id, isDeleted: false, $and: and });
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
