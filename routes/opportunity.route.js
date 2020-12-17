const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Client = mongoose.model('client');
const Logger = require('../services/logger');
const opportunityHelper = require('../helper/opportunity.helper');

router.post('/add-opportunity', async (req, res) => {
    try {
        if (req.body.publicIdentifier) {
            let opportunity = await opportunityHelper.getProfile(req.body.publicIdentifier);
            let client = await Client.findOne({ _id: req.client._id, isDeleted: false })
                .populate('opportunitys')
                .exec();
            if (!client) {
                return res.status(400).json({
                    status: 'Error',
                    message: 'Client is Not Found !',
                });
            } else {
                let flag = false;
                for (let i = 0; i < client.opportunitys.length; i++) {
                    if (opportunity.publicIdentifier === client.opportunitys[i].publicIdentifier) {
                        flag = true;
                    }
                }

                if (flag) {
                    opportunity = await Opportunity.findOneAndUpdate(
                        { publicIdentifier: opportunity.publicIdentifier },
                        opportunity,
                        { new: true },
                    );

                    Logger.log.info('Opportunity updated.');
                } else {
                    opportunity = new Opportunity(opportunity);
                    await opportunity.save();

                    client.opportunitys.push(opportunity._id);
                    await client.save();
                    Logger.log.info('New Opportunity added.');
                }
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

        let opportunity = await Opportunity.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
        return res.status(200).send({
            status: 'SUCCESS',
            data: opportunity,
        });
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
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false })
            .populate('opportunitys')
            .exec();
        if (!client) {
            res.status(400).json({
                status: 'ERROR',
                message: 'Client is not Found!',
            });
        } else {
            return res.status(200).send({
                status: 'SUCCESS',
                data: client.opportunitys,
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
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false })
            .populate('opportunitys')
            .exec();
        if (!client) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Client is not Found!',
            });
        } else {
            let flag = false;
            for (let i = 0; i < client.opportunitys.length; i++) {
                if (req.params.id == client.opportunitys[i]._id) {
                    client.opportunitys.splice(i, 1);
                    await client.save();
                    flag = true;
                    break;
                }
            }
            if (flag) {
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
        let opportunity = await Opportunity.findOne({ _id: req.params.id });
        if (!opportunity) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunitys is not Found!',
            });
        }
        opportunity = await opportunityHelper.getProfile(opportunity.publicIdentifier);

        opportunity = await Opportunity.findOneAndUpdate({ _id: req.params.id }, opportunity, { new: true });
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
