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
        let token = await linkedInHelper.genLinkedInAccessToken(
            req.query.code,
            config.backEndBaseUrl + 'client-auth/sign-up',
        );
        let user = await linkedInHelper.getLinkedInUserData(token);
        let client = await Client.findOne({ linkedInID: user.id, isDeleted: false });
        if (!client) {
            let newClient = new Client({
                firstName: user.localizedFirstName,
                lastName: user.localizedLastName,
                linkedInID: user.id,
                profilePicUrl: user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier,
            });
            await newClient.save();
            Logger.log.info('New Client is Created...');
            return res.status(200).send({
                message: 'New Client is created.',
                status: 'SUCESS',
            });
        }
        client.firstName = user.localizedFirstName;
        client.lastName = user.localizedLastName;
        client.linkedInID = user.id;
        client.profilePicUrl = user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier;
        await client.save();
        if (!client.isSubscribed) {
            Logger.log.info('Client still not Subscribed.');
            return res.status(200).send({
                message: 'Client still not Subscribed.',
                status: 'SUCESS',
            });
        } else {
            let token = client.getAuthToken();
            client.jwtToken.push(token);
            await client.save();
            console.log('Client Token ::', token);
            Logger.log.info('Login sucessfully to Client Deshbord.');
            return res.status(200).send({
                message: 'Welcome to Dashbord.',
                status: 'SUCESS',
            });
        }
    } catch (e) {
        Logger.log.error('Error in SignUp API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * get sign-up from LinkedIn
 *
 */
router.get('/sign-up-extension', async (req, res) => {
    try {
        if (!req.query.code) {
            return res.status(400).send({
                status: 'CODE_NOT_FOUND',
                message: 'Code is not Found',
            });
        }
        let token = await linkedInHelper.genLinkedInAccessToken(
            req.query.code,
            config.backEndBaseUrl + 'client-auth/sign-up-extension',
        );
        let user = await linkedInHelper.getLinkedInUserData(token);
        let client = await Client.findOne({ linkedInID: user.id, isDeleted: false });

        if (client) {
            if (client.isSubscribed) {
                let token = client.getAuthToken();
                client.jwtToken.push(token);
                await client.save();

                return res.redirect(`https://www.linkedin.com/?token=${token}`);
            } else {
                return res.redirect(`https://www.linkedin.com/`);
            }
        } else {
            return res.redirect(`https://www.linkedin.com/`);
        }
    } catch (e) {
        Logger.log.error('Error in SignUp API call.', e.message || e);
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
            'firstName lastName email phone title profilePicUrl industry companyName companySize companyLocation',
        );

        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'client is not found.',
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
/*
 update client data
 */
router.post('/update/:id', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).send({
                status: 'ERROR',
                message: `ClientId is require in params`,
            });
        }
        let client = await Client.findOne({ _id: req.params.id, isDeleted: false }).select(
            'industry companyName companySize companyLocation notificationType notificationPeriod',
        );
        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'Client is not found.',
            });
        }

        client.industry = req.body.industry;
        client.companyName = req.body.companyName;
        client.companySize = req.body.companySize;
        client.companyLocation = req.body.companyLocation;
        client['notificationType']['email'] = req.body.notificationType.email;
        client['notificationType']['browser'] = req.body.notificationType.browser;
        client['notificationPeriod']['interval'] = req.body.notificationPeriod.interval;
        client['notificationPeriod']['customDate'] = req.body.notificationPeriod.customDate;
        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            data: client,
        });
    } catch (e) {
        Logger.log.error('Error in update Client API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 * delete client
 */

router.delete('/delete/:id', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).send({
                status: 'ERROR',
                message: `ClientId is required in params.`,
            });
        } else {
            let client = await Client.findOne({ _id: req.params.id, isDeleted: false });
            if (!client) {
                return res.status(400).send({
                    status: 'CLIENT_NOT_FOUND',
                    message: 'client is not found.',
                });
            }
            client.isDeleted = true;
            client.jwtToken = [];
            await client.save();
            return res.status(200).send({
                status: 'SUCCESS',
                data: {
                    isDeleted: client.isDeleted,
                },
            });
        }
    } catch (e) {
        Logger.log.error('Error in delete Client API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
logout Client
*/

router.post('/logout', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false });
        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'client is not found.',
            });
        }

        client.jwtToken.splice(client.jwtToken.indexOf(req.client.token), 1);

        client.save();
        res.status(200).json({
            status: 'SUCESS',
            message: 'Client is Sucessfully logout.',
        });
    } catch (e) {
        Logger.log.error('Error in logout Client API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/** 
 logout from all devices
*/
router.post('/logout-all-devices', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false });
        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'Client is not found.',
            });
        }
        client.jwtToken = [];
        client.save();
        res.status(200).json({
            status: 'SUCESS',
            message: 'Client is Sucessfully logout from all devices.',
        });
    } catch (e) {
        Logger.log.error('Error in logout Client from all devices API call', e.message || e);
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
