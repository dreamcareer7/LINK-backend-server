const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Logger = require('../services/logger');
const opportunityHelper = require('../helper/opportunity.helper');

router.post('/add-opportunity', async (req, res) => {
    try {
        if (req.body.publicIdentifier) {
            let opportunityData = await opportunityHelper.getProfile(
                req.body.publicIdentifier,
                req.client.cookie,
                req.client.ajaxToken,
            );
            opportunityData.clientId = req.client._id;
            let opportunity = await Opportunity.findOne({
                clientId: req.client._id,
                isDeleted: false,
                publicIdentifier: req.body.publicIdentifier,
            });

            if (opportunity) {
                opportunity = await Opportunity.findOneAndUpdate(
                    { clientId: req.client._id, isDeleted: false, publicIdentifier: req.body.publicIdentifier },
                    opportunityData,
                    { new: true },
                );
                Logger.log.info('Opportunity updated.');
            } else {
                opportunity = new Opportunity(opportunityData);
                await opportunity.save();
                Logger.log.info('New Opportunity added.');
            }
            return res.status(200).send({
                status: 'SUCCESS',
                data: opportunity,
            });
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

router.put('/update-opportunity/:id', async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Require field is Missing.',
            });
        }
        let opportunity = await Opportunity.findOneAndUpdate(
            { _id: req.params.id, clientId: req.client._id, isDeleted: false },
            req.body,
            { new: true },
        );
        if (opportunity) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: opportunity,
            });
        } else {
            return res.status(400).send({
                status: 'NOT_FOUND',
                data: 'Opportunity is not found.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in update opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

router.get('/get-opportunity', async (req, res) => {
    try {
        let opportunitys = await Opportunity.find({ clientId: req.client._id, isDeleted: false }, req.body, {
            new: true,
        });

        if (opportunitys) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: opportunitys,
            });
        } else {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Opportunitys  is Not found..',
            });
        }
    } catch (e) {
        Logger.log.error('Error in get opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

router.delete('/delete-opportunity/:id', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOneAndUpdate(
            { _id: req.params.id, clientId: req.client._id, isDeleted: false },
            { isDeleted: true },
            { new: true },
        );
        if (opportunity) {
            return res.status(200).json({
                status: 'SUCESS',
                message: 'opportunitys is Deleted sucessfully.',
            });
        } else {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunitys is not Found!',
            });
        }
    } catch (e) {
        Logger.log.error('Error in delete Opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

router.post('/sync-with-linkedIn/:id', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOne({ _id: req.params.id, clientId: req.client._id, isDeleted: false });
        if (!opportunity) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunitys is not Found!',
            });
        }
        opportunityData = await opportunityHelper.getProfile(
            opportunity.publicIdentifier,
            req.client.cookie,
            req.client.ajaxToken,
        );

        opportunity = await Opportunity.findOneAndUpdate(
            { _id: req.params.id, clientId: req.client._id, isDeleted: false },
            opportunityData,
            { new: true },
        );
        return res.status(200).json({
            status: 'SUCESS',
            data: opportunity,
        });
    } catch (e) {
        Logger.log.error('Error in sync with linkedIn API call.', e.message || e);
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
