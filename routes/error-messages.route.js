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
        organization.errorMessages.push({ title: req.body.title, text: req.body.text });
        await organization.save();
        res.status(200).send({
            status: 'SUCESS',
            data: organization.errorMessages,
        });
    } catch (e) {
        Logger.log.error('Error in Add Message API call', e.message || e);
        res.status(500).json({
            status: 'Error',
            message: error.message,
        });
    }
});

/**
 *
 * update message by id
 */

router.put('/update-message/:id', async function(req, res) {
    try {
        if (!req.body.title || !req.body.text || !req.params.id) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'Error Title and Text and Id is Required !',
            });
        }

        await Organization.updateOne(
            { organizationId: config.organization.organizationId, 'errorMessages._id': req.params.id },
            { $set: { 'errorMessages.$.title': req.body.title, 'errorMessages.$.text': req.body.text } },
        );
        let org = await Organization.findOne({
            organizationId: config.organization.organizationId,
        });
        res.status(200).send({
            status: 'SUCESS',
            data: org.errorMessages,
        });
    } catch (e) {
        Logger.log.error('Error in Add Message API call', e.message || e);
        res.status(500).json({
            status: 'Error',
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
            status: 'SUCESS',
            data: org.errorMessages,
        });
    } catch (e) {
        Logger.log.error('Error in get all Message API call', e.message || e);
        res.status(500).json({
            status: 'Error',
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

        let organization = await Organization.findOneAndUpdate(
            { organizationId: config.organization.organizationId },
            {
                $pull: { errorMessages: { _id: req.params.id } },
            },
        );

        res.status(200).send({
            status: 'SUCESS',
            data: organization.errorMessages,
        });
    } catch (e) {
        Logger.log.error('Error in delete Message API call', e.message || e);
        res.status(500).json({
            status: 'Error',
            message: e.message,
        });
    }
});

/**
 * Export Router
 */
module.exports = router;
