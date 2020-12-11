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
        client.firstName = user.localizedFirstName;
        client.lastName = user.localizedLastName;
        client.linkedInID = user.id;
        client.profileUrl = user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier;
        client.isSubscribed = true;
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
            // setTimeout(() => {
            console.log('Calling the internal route at::', new Date());
            // res.sendFile('linkedin-signin.html', {root: __dirname })

            return res.redirect(`https://ec31b11c5d51.ngrok.io/linkedin-signin.html?linkedInId=${client.linkedInID}`);
            // }, 3000);
        }
    } catch (e) {
        Logger.log.error('Error in SignUp API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

router.get('/server', async (req, res) => {
    console.log('In the internal route at::', new Date());
    setTimeout(() => {
        console.log('Redirecting to LinkedIn at::', new Date());
        return res.redirect('https://www.linkedin.com/');
    }, 3000);
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
        let client = await Client.findOne({ _id: req.params.id, isDeleted: false });
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
            data: {
                industry: client.industry,
                companyName: client.companyName,
                companySize: client.companySize,
                companyLocation: client.companyLocation,
                notificationType: {
                    email: client.notificationType.email,
                    browser: client.notificationType.browser,
                },
                notificationPeriod: {
                    interval: client.notificationPeriod.interval,
                    customDate: client.notificationPeriod.customDate,
                },
            },
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
        for (let i = 0; i < client.jwtToken.length; i++) {
            if (client.jwtToken[i].token === req.client.token) {
                client.jwtToken.splice(i, 1);
                break;
            }
        }
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
