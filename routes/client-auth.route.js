const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Conversation = mongoose.model('conversation');
const config = require('../config');
const authMiddleWare = require('../middleware/authenticate');
const linkedInHelper = require('../helper/linkedin.helper');
const cookieHelper = require('../helper/cookie.helper');
const conversationHelper = require('../helper/conversation.helper');
const opportunityHelper = require('../helper/opportunity.helper');

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
        let contactInfo = await linkedInHelper.getContactInfo(token);
        if (contactInfo.email) {
            client.email = contactInfo.email;
        }
        if (contactInfo.phone) {
            client.phone = contactInfo.phone;
        }
        await client.save();
        if (!client.isSubscribed) {
            Logger.log.info('Client still not Subscribed.');
            return res.status(200).send({
                message: 'Client still not Subscribed.',
                status: 'SUCCESS',
            });
        } else {
            let token = client.getAuthToken();
            // client.jwtToken.push(token);
            // await client.save();
            console.log('Client Token ::', token);
            Logger.log.info('Login Successfully to Client Deshbord.');
            // return res.status(200).send({
            //     message: 'Welcome to Dashbord.',
            //     status: 'SUCCESS',
            // });
            return res.redirect(`${config.clientUrls.clientFrontEndBaseUrl}auth-verify?token=${token}`);
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
 * checks the cookie is valid or not / also checks for client is loged in or not in crome extension
 */
router.get(
    '/checking-for-cookie',
    authMiddleWare.clientAuthMiddleWare,

    async (req, res) => {
        try {
            let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
            await opportunityHelper.getProfile(req.client.publicIdentifier, cookieStr, ajaxToken);
            if (req.client.hasOwnProperty('publicIdentifier') && req.client.hasOwnProperty('cookie')) {
                return res.status(200).send({
                    message: req.client,
                    status: 'SUCCESS',
                });
            } else {
                throw new Error('publicIdentifier or cookie is not found in db.');
            }
        } catch (e) {
            console.log(e);
            Logger.log.error('Error in checking-for-cookie API call.', e.message || e);
            res.status(500).json({
                status: e.status || 'ERROR',
                message: e.message,
            });
        }
    },
);

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
        console.log('client::', client);
        if (client) {
            if (client.isSubscribed) {
                let token = client.getAuthToken();
                // client.jwtToken.push(token);
                // await client.save();

                return res.redirect(`${config.backEndBaseUrl}linkedin-signin.html?token=${token}&is=1`);
            } else {
                return res.redirect(`${config.backEndBaseUrl}linkedin-signin.html?token=${token}&is=0`);
                // return res.redirect(`https://www.linkedin.com/`);
            }
        } else {
            return res.redirect(`${config.backEndBaseUrl}linkedin-signin.html?token=${token}&is=0`);
            // return res.redirect(`https://www.linkedin.com/`);
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
        let clientData = await Client.findOne({ _id: req.client._id, isDeleted: false }).lean();
        req.client.loggedInIdentifier = req.body.publicIdentifier;
        await req.client.save();
        if (clientData.hasOwnProperty('publicIdentifier')) {
            if (clientData.publicIdentifier !== req.body.publicIdentifier) {
                return res.status(401).send({
                    status: 'ERROR',
                    message: 'Invalid user.',
                });
            }
        }

        if (!req.body.cookie) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Cookie is Not found.',
            });
        }
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false });

        client.cookie = req.body.cookie;
        client.publicIdentifier = req.body.publicIdentifier;
        if (client.isConversationAdded === false) {
            client.isConversationAdded = true;
            await client.save();
            try {
                let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.body.cookie);
                let clientInfo = await opportunityHelper.getProfile(req.body.publicIdentifier, cookieStr, ajaxToken);
                client.title = clientInfo.title;
                client.companyName = clientInfo.companyName;
                client.linkedInUrl = clientInfo.linkedInUrl;
                client.companyLocation = clientInfo.location;
                await client.save();
                let conversations = await conversationHelper.extractChats({ cookie: cookieStr, ajaxToken: ajaxToken });

                let newConversation = new Conversation({
                    clientId: req.client._id,
                });
                await newConversation.save();

                for (let i = 0; i < conversations.length; i++) {
                    await newConversation.conversations.push({
                        conversationId: conversations[i].conversationId,
                        publicIdentifier: conversations[i].publicIdentifier,
                    });
                }

                await newConversation.save();
            } catch (e) {
                client.isConversationAdded = false;
                await client.save();
            }
        }

        await client.save();

        return res.status(200).send({
            status: 'SUCCESS',
            message: 'Cookie Sucessfully saved.',
        });
    } catch (e) {
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
        decoded = jwt.verify(req.query.requestedToken, config.jwt.secret);
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
                // client.jwtToken.push(token);
                // await client.save();
                console.log('Client Token ::', token);
                Logger.log.info('Login Successfully to Client Deshbord.');
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
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false })
            .select(
                'firstName lastName email phone title profilePicUrl industry companyName companySize companyLocation isDeleted selectedPlan',
            )
            .lean();
        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'client is not found.',
            });
        }
        let activeStatus = ['FREE_TRIAL', 'MONTHLY', 'YEARLY'];
        client.isActive =
            client.selectedPlan &&
            client.selectedPlan.status &&
            activeStatus.indexOf(client.selectedPlan.status) !== -1;
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
router.post('/update', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
        );
        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'Client is not found.',
            });
        }
        client.firstName = req.body.firstName;
        client.lastName = req.body.lastName;
        client.email = req.body.email;
        client.phone = req.body.phone;
        client.title = req.body.title;
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

/*
 Add FCM Token
 */
router.put('/add-fcm-token', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        if (!req.body.fcmToken) {
            return res.status(400).send({
                status: 'FCM_TOKEN_NOT_FOUND',
                message: 'FCM Token is not Found',
            });
        }
        await Client.updateOne({ _id: req.client._id }, { $addToSet: { fcmToken: req.body.fcmToken } });
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'FCM Token added successfully',
        });
    } catch (e) {
        Logger.log.error('Error in pushing FCM Token', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 * delete client
 */

router.delete('/delete', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false });
        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'client is not found.',
            });
        }
        client.isDeleted = true;
        // client.jwtToken = [];
        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            data: {
                isDeleted: client.isDeleted,
            },
        });
    } catch (e) {
        Logger.log.error('Error in delete Client API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
/**
 * paused subscribers by client
 */
router.put('/paused-subscription', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
        );
        if (!client) {
            return res.status(400).json({
                status: 'SUBSCRIBER_NOT_FOUND',
                message: 'subscriber is not found.',
            });
        }

        if (req.body.isSubscriptionPaused === true) {
            client.selectedPlan.status = 'PAUSED';
        } else {
            client.selectedPlan.status = client.selectedPlan.currentPlan;
        }

        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            data: client,
        });
    } catch (e) {
        Logger.log.error('Error in paused-subscription API call', e.message || e);
        return res.status(500).json({
            status: 'ERROR',
            message: error.message,
        });
    }
});
/**
 * cancel subscribers by client
 */
router.put('/cancel-subscription', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
        );
        if (!client) {
            return res.status(400).json({
                status: 'SUBSCRIBER_NOT_FOUND',
                message: 'subscriber is not found.',
            });
        }
        if (req.body.isSubscriptionCancelled === true) {
            client.selectedPlan.status = 'CANCELLED';
        } else {
            client.selectedPlan.status = client.selectedPlan.currentPlan;
        }
        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            data: client,
        });
    } catch (e) {
        Logger.log.error('Error in cancel-subscription API call', e.message || e);
        return res.status(500).json({
            status: 'ERROR',
            message: error.message,
        });
    }
});

/*
logout Client
*/

router.post('/logout', async (req, res) => {
    try {
        if (!req.body.fcmToken) {
            Logger.log.warn('No FCM Token Present at time of Logout');
            return res.status(200).send({
                status: 'SUCCESS',
                message: 'Client is Successfully logout.',
            });
        }
        let token = req.header('authorization');
        if (!token) {
            Logger.log.warn('JWT - Auth-Token not set in header for Logout Call');
            return res.status(401).send({ message: 'Auth-Token not set in header' });
        }
        let decoded = jwt.verify(token, config.jwt.secret);
        await Client.updateOne({ _id: decoded._id }, { $pull: { fcmToken: req.body.fcmToken } });
        res.status(200).json({
            status: 'SUCCESS',
            message: 'Client is Successfully logout.',
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
 logout from all devices Not in use for now
 */
// router.post('/logout-all-devices', async (req, res) => {
//     try {
//         let client = await Client.findOne({ _id: req.client._id, isDeleted: false });
//         if (!client) {
//             return res.status(400).send({
//                 status: 'CLIENT_NOT_FOUND',
//                 message: 'Client is not found.',
//             });
//         }
//         // client.jwtToken = [];
//         client.save();
//         res.status(200).json({
//             status: 'SUCCESS',
//             message: 'Client is Successfully logout from all devices.',
//         });
//     } catch (e) {
//         Logger.log.error('Error in logout Client from all devices API call', e.message || e);
//         res.status(500).json({
//             status: 'ERROR',
//             message: e.message,
//         });
//     }
// });

/**
 * Export Router
 */
module.exports = router;
