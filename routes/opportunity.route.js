const express = require('express');
const router = express.Router();
const config = require('../config');
const Logger = require('../services/logger');
const opportunityHelper = require('../helper/opportunity.helper');

router.get('/add-opportunity', async (req, res) => {
    try {
        if (req.body.publicIdentifier || req.body.conversationId) {
            if (req.body.publicIdentifier) {
                await opportunityHelper.getProfile(req.body.publicIdentifier);
                return res.status(200).send({
                    status: 'SUCCESS',
                });
            } else if (req.body.conversationId) {
            }
        } else {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Required field is Missing.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in add opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

router.put('/update-opportunity', async (req, res) => {});

router.get('/get-opportunity', async (req, res) => {});

/**
 * Export Router
 */
module.exports = router;
