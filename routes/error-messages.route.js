const express = require('express');
const config = require('../config');
const router = express.Router();
const mongoose = require('mongoose');
const Organization = mongoose.model('organization');
const Logger = require('../services/logger');

/**
 *
 * add error message
 */

router.post('/add-message', async function(req, res) {
    try {
        if (!req.body.title || !req.body.text) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'Error Title and Text is Required !',
            });
        }
        let organization = await Organization.findOne({
            organizationId: config.organization.organizationId,
        });
        organization.errorMessages.push({
            title: req.body.title,
            text: req.body.text,
            description: req.body.description,
        });
        await organization.save();
        res.status(200).send({
            status: 'SUCCESS',
            data: organization.errorMessages,
        });
    } catch (e) {
        Logger.log.error('Error in Add Message API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
        });
    }
});

/**
 *
 * update message by id
 */

router.put('/update-messages/', async function(req, res) {
    try {
        if (!req.body.errorMessages || req.body.errorMessages.length === 0) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'Error Title and Text and Id is Required !',
            });
        }

        let organization = await Organization.findOne({ organizationId: config.organization.organizationId }).select({
            errorMessages: 1,
        });
        for (let i = 0; i < req.body.errorMessages.length; i++) {
            for (let j = 0; j < organization.errorMessages.length; j++) {
                if (req.body.errorMessages[i]._id.toString() === organization.errorMessages[j]._id.toString()) {
                    organization.errorMessages[j].text = req.body.errorMessages[i].text;
                    break;
                }
            }
        }
        await organization.save();
        res.status(200).send({
            status: 'SUCCESS',
            data: org.errorMessages,
        });
    } catch (e) {
        Logger.log.error('Error in Add Message API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
/**
 *
 * get all error message
 */

router.get('/get-messages', async function(req, res) {
    try {
        let org = await Organization.findOne({
            organizationId: config.organization.organizationId,
        });
        res.status(200).send({
            status: 'SUCCESS',
            data: org.errorMessages,
        });
    } catch (e) {
        Logger.log.error('Error in get all Message API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 * delete message by id
 *
 */

router.delete('/delete-message/:id', async function(req, res) {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'delete message id must be in params !',
            });
        }

        await Organization.updateOne(
            { organizationId: config.organization.organizationId },
            {
                $pull: { errorMessages: { _id: req.params.id } },
            },
        );

        res.status(200).send({
            status: 'SUCCESS',
            message: 'Error message deleted Successfully.',
        });
    } catch (e) {
        Logger.log.error('Error in delete Message API call', e.message || e);
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
