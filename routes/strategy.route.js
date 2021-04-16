const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Strategy = mongoose.model('strategy');
const Logger = require('../services/logger');
const authMiddleWare = require('../middleware/authenticate');

/*
Add strategy
*/
router.post('/', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        if (!req.body.title || !req.body.description || !req.body.videoScript) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'Enter mandatory Fields.',
            });
        }
        let sequenceNumber = req.body.sequenceNumber;
        if (req.body.hasOwnProperty('sequenceNumber')) {
            const existingStrategy = await Strategy.findOne({
                sequenceNumber: req.body.sequenceNumber,
                isDeleted: false,
            });
            if (existingStrategy) {
                return res.status(400).json({
                    status: 'STRATEGY_WITH_SAME_NUMBER_EXISTS',
                    message: 'Strategy with same sequence number exists.',
                });
            }
        }
        let strategy = new Strategy(req.body);
        if (!sequenceNumber) {
            const existingLastStrategy = await Strategy.find({ sequenceNumber: req.body.sequenceNumber })
                .sort({ sequenceNumber: -1 })
                .limit(1);
            if (existingLastStrategy.length === 0) {
                sequenceNumber = 0;
            } else {
                sequenceNumber = existingLastStrategy[0].sequenceNumber + 1;
            }
            strategy.sequenceNumber = sequenceNumber;
        }
        await strategy.save();
        res.status(200).send({
            status: 'SUCCESS',
            data: strategy,
        });
    } catch (e) {
        Logger.log.error('Error in adding strategy.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
update strategy
*/
router.put('/:sequenceNumber', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        if (!req.body.title || !req.body.description || !req.body.videoScript || !req.params['sequenceNumber']) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'Enter mandatory Fields.',
            });
        }
        await Strategy.updateOne(
            {
                sequenceNumber: req.params['sequenceNumber'],
            },
            req.body,
        );
        res.status(200).send({
            status: 'SUCCESS',
            data: 'Strategy updated successfully',
        });
    } catch (e) {
        Logger.log.error('Error in updating strategy.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
Delete Strategy
*/
router.delete('/:sequenceNumber', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        if (!req.params['sequenceNumber']) {
            return res.status(400).json({
                status: 'SEQUENCE_NUMBER_NOT_FOUND',
                message: 'Sequence Number is requires in params.',
            });
        }
        await Strategy.updateOne({ sequenceNumber: req.params['sequenceNumber'] }, { isDeleted: true });
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'Strategy deleted successfully.',
        });
    } catch (e) {
        Logger.log.error('Error in deleting strategy.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
List Strategies
*/
router.get('/admin', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let strategies = await Strategy.find({ isDeleted: false })
            .sort({ sequenceNumber: 1 })
            .lean();
        return res.status(200).send({
            status: 'SUCCESS',
            data: strategies,
        });
    } catch (e) {
        Logger.log.error('Error in get all strategies.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
/*
List Strategies
*/
router.get('/', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let strategies = await Strategy.find({ isDeleted: false })
            .sort({ sequenceNumber: 1 })
            .lean();
        return res.status(200).send({
            status: 'SUCCESS',
            data: strategies,
        });
    } catch (e) {
        Logger.log.error('Error in get all strategies.', e.message || e);
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
