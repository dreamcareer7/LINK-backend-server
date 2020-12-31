const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Opportunity = mongoose.model('opportunity');
const Logger = require('../services/logger');

router.get('/deal-value', async (req, res) => {
    try {
        let opportunity = await Opportunity.find({}).select('dealSize');
        return res.status(200).send({
            status: 'SUCCESS',
            data: opportunity,
            length: opportunity.length,
        });
    } catch (e) {
        Logger.log.error('Error in get deal value of opportunity API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.get('/industries', async (req, res) => {
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
                                'selectedPlan.currentPlan': req.body.selectedPlan,
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
        ]);
        return res.status(200).send({
            status: 'SUCCESS',
            data: data,
        });
    } catch (e) {
        Logger.log.error('Error in  API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.get('/', async (req, res) => {
    try {
    } catch (e) {
        Logger.log.error('Error in  API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.get('/', async (req, res) => {
    try {
    } catch (e) {
        Logger.log.error('Error in  API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.get('/', async (req, res) => {
    try {
    } catch (e) {
        Logger.log.error('Error in  API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
router.get('/', async (req, res) => {
    try {
    } catch (e) {
        Logger.log.error('Error in  API call', e.message || e);
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
