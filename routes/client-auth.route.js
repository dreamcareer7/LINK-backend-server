const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const config = require('../config');
const authMiddleWare = require('../middleware/authenticate');
const linkedInHelper = require('../helper/linkedin.helper');
const Logger = require('../services/logger');

/**
 * get sign-up from LinkedIn
 *
 */
router.get('/sign-up', async (req, res) => {
    try {
        if (!req.query.code) {
            return res.status(400).send({
                status: 'CODE_NOT_FOUND',
                message: 'Code is not Found',
            });
        }
        let token = await linkedInHelper.genLinkedInAccessToken(req.query.code);
        let user = await linkedInHelper.getLinkedInUserData(token);
        let client = await Client.findOne({ linkedInID: user.id, isDeleted: false });
        if (!client) {
            let newClient = new Client({
                firstName: user.localizedFirstName,
                lastName: user.localizedLastName,
                linkedInID: user.id,
                profileUrl: user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier,
            });
            await newClient.save();
            Logger.log.info('New Client is Created...');
            return res.status(200).send({
                message: 'New Client is created.',
                status: 'SUCESS',
            });
        }
        (client.firstName = user.localizedFirstName),
            (client.lastName = user.localizedLastName),
            (client.linkedInID = user.id),
            (client.profileUrl = user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier);
        await client.save();
        if (!client.isSubscribed) {
            Logger.log.info('Client still not Subscribed.');
            return res.status(200).send({
                message: 'Client still not Subscribed.',
                status: 'SUCESS',
            });
        } else {
            let token = client.getAuthToken();
            let d = new Date();
            client.jwtToken.push({
                expiredTime: parseInt(config.expireTime) * 3600000 + d.getTime(),
                token: token,
            });
            await client.save();
            console.log('Client Token ::', token);
            Logger.log.info('Login sucessfully to Client Deshbord.');
            return res.status(200).send({
                message: 'Welcome to Dashbord.',
                status: 'SUCESS',
            });
        }
    } catch (e) {
        Logger.log.error('Error in getCode API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * get Client Data
 *
 */

router.get('/get-client', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false }).select(
            'firstName lastName email phone title profileUrl industry companyName companySize companyLocation',
        );

        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'clent is not found.',
            });
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: client,
        });
    } catch (e) {
        Logger.log.error('Error in get client API.', e.message || e);
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
