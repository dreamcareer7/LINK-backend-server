const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const config = require('../config');
const authMiddleWare = require('../middleware/authenticate');
const linkedInHelper = require('../helper/linkedin.helper');
const Logger = require('../services/logger');
const jwt = require('jsonwebtoken');

/**
 *  sign-up from LinkedIn
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
        console.log(token);
        let client = await Client.findOne({ linkedInID: user.id, isDeleted: false });
        if (!client) {
            let newClient = new Client({
                firstName: user.localizedFirstName,
                lastName: user.localizedLastName,
                linkedInID: user.id,
                profilePicUrl: user.hasOwnProperty('profilePicture')
                    ? user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier
                    : null,
            });
            await newClient.save();
            Logger.log.info('New Client is Created...');
            return res.status(200).send({
                message: 'New Client is created.',
                status: 'SUCCESS',
            });
        }
        client.firstName = user.localizedFirstName;
        client.lastName = user.localizedLastName;
        client.linkedInID = user.id;
        client.profilePicUrl = user.hasOwnProperty('profilePicture')
            ? user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier
            : null;
        await client.save();
        if (!client.isSubscribed) {
            Logger.log.info('Client still not Subscribed.');
            return res.status(200).send({
                message: 'Client still not Subscribed.',
                status: 'SUCCESS',
            });
        } else {
            let token = client.getAuthToken();
            client.jwtToken.push(token);
            await client.save();
            console.log('Client Token ::', token);
            Logger.log.info('Login SUCCESSfully to Client Deshbord.');
            return res.status(200).send({
                message: 'Welcome to Dashbord.',
                status: 'SUCCESS',
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
 *  sign-up from LinkedIn
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
        console.log(req.query.code);
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

                return res.redirect(`${config.backEndBaseUrl}linkedin-signin.html?token=${token}`);
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
 * get cookie from LinkedIn
 */
router.post('/get-cookie', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        if (!req.body.cookie || !req.body.ajaxToken) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'require field is missing.',
            });
        }
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false });
        if (!client) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'client is not Found',
            });
        }
        client.cookie = req.body.cookie;
        client.ajaxToken = req.body.ajaxToken;
        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'Cookie SUCCESSfully saved.',
        });
    } catch {
        Logger.log.error('Error in get cookie and token call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * sign-up from LinkedIn
 *
 */
router.get('/sign-up-invitation', async (req, res) => {
    try {
        if (!req.query.code) {
            return res.status(400).send({
                status: 'CODE_NOT_FOUND',
                message: 'Code is not Found',
            });
        }
        console.log(req.query.code);
        let token = await linkedInHelper.genLinkedInAccessToken(
            req.query.code,
            config.backEndBaseUrl + `client-auth/sign-up-invitation?requestedToken=${req.query.requestedToken}`,
        );
        let user = await linkedInHelper.getLinkedInUserData(token);
        decoded = jwt.verify(req.query.requestedToken, config.jwtSecret);
        let client = await Client.findOne({ linkedInID: user.id, isDeleted: false });
        if (!client) {
            let c = await Client.findOne({ _id: decoded._id, isDeleted: false });
            if (c) {
                if (c.invitedToken == req.query.requestedToken) {
                    c.firstName = user.localizedFirstName;
                    c.lastName = user.localizedLastName;
                    c.linkedInID = user.id;
                    c.profilePicUrl = user.hasOwnProperty('profilePicture')
                        ? user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier
                        : null;
                    c.invitedToken = null;
                    await c.save();
                    return res.status(200).send({
                        message: 'Client still not Subscribed.',
                        status: 'SUCCESS',
                    });
                } else {
                    return res.status(400).send({
                        status: 'NOT_FOUND',
                        message: 'Client Invitation token is not found.',
                    });
                }
            } else {
                return res.status(400).send({
                    status: 'NOT_FOUND',
                    message: 'Client is not found.',
                });
            }
        } else {
            if (!client.isSubscribed) {
                Logger.log.info('Client still not Subscribed.');
                return res.status(200).send({
                    message: 'Client still not Subscribed.',
                    status: 'SUCCESS',
                });
            } else {
                let token = client.getAuthToken();
                client.jwtToken.push(token);
                await client.save();
                console.log('Client Token ::', token);
                Logger.log.info('Login SUCCESSfully to Client Deshbord.');
                return res.status(200).send({
                    message: 'Welcome to Dashbord.',
                    status: 'SUCCESS',
                });
            }
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
            status: 'SUCCESS',
            message: 'Client is SUCCESSfully logout.',
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
            status: 'SUCCESS',
            message: 'Client is SUCCESSfully logout from all devices.',
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
