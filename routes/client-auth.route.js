const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Conversation = mongoose.model('conversation');
const Payment = mongoose.model('payment');
const Invoice = mongoose.model('invoice');
const config = require('../config');
const authMiddleWare = require('../middleware/authenticate');
const linkedInHelper = require('../helper/linkedin.helper');
const cookieHelper = require('../helper/cookie.helper');
const conversationHelper = require('../helper/conversation.helper');
const opportunityHelper = require('../helper/opportunity.helper');
const stripeHelper = require('../helper/stripe.helper');

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
        let subscriptionId = req.query.subscription_id;
        let redirectUrl = config.backEndBaseUrl + 'client-auth/sign-up';
        if (subscriptionId) {
            redirectUrl += '?subscription_id=' + subscriptionId;
        }
        let token = await linkedInHelper.genLinkedInAccessToken(req.query.code, redirectUrl);
        let user = await linkedInHelper.getLinkedInUserData(token);
        let client = await Client.findOne({ linkedInID: user.id, isDeleted: false });
        if (!client) {
            if (!subscriptionId) {
                return res.redirect(config.linkFluencer.paymentPageUrl);
            }
            let payment = await Payment.findOne({
                stripeSubscriptionId: subscriptionId,
                isDeleted: false,
            }).populate('clientId');

            if (!payment || !payment.clientId || !payment.clientId._id) {
                return res.redirect(config.linkFluencer.paymentPageUrl);
            }
            client = payment.clientId;
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
            // console.log('Client Token ::', token);
            Logger.log.info('Login Successfully to Client Deshbord.');
            // return res.status(200).send({
            //     message: 'Welcome to Dashbord.',
            //     status: 'SUCCESS',
            // });
            return res.redirect(`${config.clientUrls.clientFrontEndBaseUrl}auth-verify?token=${token}`);
        }
    } catch (e) {
        Logger.log.error('Error in SignUp API call.', e.message || e);
        return res.redirect(
            `${config.clientUrls.clientFrontEndBaseUrl}signUp?message=Error signing up with LinkedIn. Please try again.`,
        );
        // res.status(500).json({
        //     status: e.status || 'ERROR',
        //     message: e.message,
        // });
    }
});

/**
 * checks the cookie is valid or not / also checks for client is loged in or not in crome extension
 */
router.get('/checking-for-cookie', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        if (!req.client.cookie || !req.client.isExtensionInstalled) {
            Logger.log.error('Extension is not installed yet.');
            return res.status(400).json({
                status: 'READ_ERROR_MESSAGE',
                message: 'extension_not_installed',
            });
        }
        if (!req.client.cookie || req.client.isCookieExpired) {
            Logger.log.error('Cookie is expired.');
            return res.status(400).json({
                status: 'READ_ERROR_MESSAGE',
                message: 'cookie_expired',
            });
        }
        let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
        await opportunityHelper.getProfile(req.client.publicIdentifier, cookieStr, ajaxToken);
        if (req.client.publicIdentifier && req.client.cookie) {
            return res.status(200).send({
                message: req.client,
                status: 'SUCCESS',
            });
        }
        return res.status(200).send({
            message: req.client,
            status: 'SUCCESS',
        });
    } catch (e) {
        req.client.isCookieExpired = true;
        await req.client.save();
        Logger.log.error('Error in checking-for-cookie API call.', e.message || e);
        return res.status(500).json({
            status: 'READ_ERROR_MESSAGE',
            message: 'cookie_expired',
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
        let linkedInToken = await linkedInHelper.genLinkedInAccessToken(
            req.query.code,
            config.backEndBaseUrl + 'client-auth/sign-up-extension',
        );
        let user = await linkedInHelper.getLinkedInUserData(linkedInToken);
        let client = await Client.findOne({ linkedInID: user.id, isDeleted: false });
        let linkedInIdToken = linkedInHelper.getLinkedInIdToken(linkedInToken);
        if (client) {
            let token = client.getAuthToken();
            if (client.isSubscribed && !client.isSubscriptionCancelled) {
                if (!client.isExtensionInstalled) {
                    client.isExtensionInstalled = true;
                }
                await client.save();
                return res.redirect(
                    `${config.backEndBaseUrl}linkedin-signin.html?token=${token}&lToken=${linkedInIdToken}&is=1`,
                );
            } else {
                return res.redirect(
                    `${config.backEndBaseUrl}linkedin-signin.html?token=${token}&lToken=${linkedInIdToken}&is=0`,
                );
            }
        } else {
            //TODO confirm for Open Sign Up
            return res.redirect(`${config.backEndBaseUrl}linkedin-signin.html?token=&lToken=${linkedInIdToken}&is=0`);
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
 *  Get Profile For Chrome Extension
 *
 */
router.get('/get-profile-for-extension', async (req, res) => {
    try {
        let lToken = req.header('authorization');
        if (!lToken) {
            Logger.log.warn('L Token not set in header');
            return res.status(401).send({ message: 'L Token not set in header' });
        }
        let decoded;
        let jwtSecret = config.jwt.secret;
        let d = new Date();
        try {
            decoded = jwt.verify(lToken, jwtSecret);
            if (!decoded.linkedInId || decoded.expiredTime < d.getTime()) {
                return res.status(401).send({ message: 'Invalid Token or expired' });
            }
            let user = await linkedInHelper.getLinkedInUserData(decoded.linkedInId);
            let client = await Client.findOne({ linkedInID: user.id, isDeleted: false });
            let dataObj = {};
            if (client) {
                dataObj = {
                    profileTitle: client.title ? client.title : '',
                    profileName:
                        (client.firstName ? client.firstName : '') + (client.lastName ? ' ' + client.lastName : ''),
                    profilePicture: client.profilePicUrl,
                };
            } else {
                dataObj = {
                    profileTitle: '',
                    profileName: user.localizedFirstName + (user.localizedLastName ? ' ' + user.localizedLastName : ''),
                    profilePicture: user.hasOwnProperty('profilePicture')
                        ? user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier
                        : null,
                };
            }
            return res.status(200).send({
                status: 'SUCCESS',
                data: dataObj,
            });
        } catch (e) {
            Logger.log.error('Error occurred.', e.message || e);
            return res.status(401).send({ message: 'Invalid Auth-Token' });
        }
    } catch (e) {
        Logger.log.error('Error in get profile for Extension API call.', e.message || e);
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
            client.isCookieExpired = false;
            await client.save();
            try {
                let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.body.cookie);
                let clientInfo = await opportunityHelper.getProfile(req.body.publicIdentifier, cookieStr, ajaxToken);
                client.title = clientInfo.title;
                client.companyName = clientInfo.companyName;
                client.linkedInUrl = clientInfo.linkedInUrl;
                client.companyLocation = clientInfo.location;
                client.profilePicUrl = clientInfo.profilePicUrl;
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
                return res.status(200).json({
                    status: 'SUCCESS',
                    message: 'Cookie Successfully saved without fetching chats.',
                });
            }
        } else {
            client.isCookieExpired = false;
            await client.save();
        }
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'Cookie Successfully saved.',
        });
    } catch (e) {
        Logger.log.error('Error in get cookie and token call.', e.message || e);
        return res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/*
 * Not in Use now
 * */
/**
 * sign-up from LinkedIn
 *
 */
// router.get('/sign-up-invitation', async (req, res) => {
//     try {
//         if (!req.query.code) {
//             return res.status(400).send({
//                 status: 'CODE_NOT_FOUND',
//                 message: 'Code is not Found',
//             });
//         }
//         // console.log(req.query.code);
//         let token = await linkedInHelper.genLinkedInAccessToken(
//             req.query.code,
//             config.backEndBaseUrl + `client-auth/sign-up-invitation?requestedToken=${req.query.requestedToken}`,
//         );
//         let user = await linkedInHelper.getLinkedInUserData(token);
//         decoded = jwt.verify(req.query.requestedToken, config.jwt.secret);
//         let client = await Client.findOne({ linkedInID: user.id, isDeleted: false });
//         if (!client) {
//             let c = await Client.findOne({ _id: decoded._id, isDeleted: false });
//             if (c) {
//                 if (c.invitedToken == req.query.requestedToken) {
//                     c.firstName = user.localizedFirstName;
//                     c.lastName = user.localizedLastName;
//                     c.linkedInID = user.id;
//                     c.profilePicUrl = user.hasOwnProperty('profilePicture')
//                         ? user.profilePicture['displayImage~'].elements[3].identifiers[0].identifier
//                         : null;
//                     c.invitedToken = null;
//                     await c.save();
//                     return res.status(200).send({
//                         message: 'Client still not Subscribed.',
//                         status: 'SUCCESS',
//                     });
//                 } else {
//                     return res.status(400).send({
//                         status: 'NOT_FOUND',
//                         message: 'Client Invitation token is not found.',
//                     });
//                 }
//             } else {
//                 return res.status(400).send({
//                     status: 'NOT_FOUND',
//                     message: 'Client is not found.',
//                 });
//             }
//         } else {
//             if (!client.isSubscribed) {
//                 Logger.log.info('Client still not Subscribed.');
//                 return res.status(200).send({
//                     message: 'Client still not Subscribed.',
//                     status: 'SUCCESS',
//                 });
//             } else {
//                 let token = client.getAuthToken();
//                 // client.jwtToken.push(token);
//                 // await client.save();
//                 // console.log('Client Token ::', token);
//                 Logger.log.info('Login Successfully to Client Deshbord.');
//                 return res.status(200).send({
//                     message: 'Welcome to Dashbord.',
//                     status: 'SUCCESS',
//                 });
//             }
//         }
//     } catch (e) {
//         Logger.log.error('Error in SignUp API call.', e.message || e);
//         res.status(500).json({
//             status: e.status || 'ERROR',
//             message: e.message,
//         });
//     }
// });

/**
 * get Client Data
 *
 */
router.get('/get-client', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false }).select(
            'firstName lastName email phone title profilePicUrl industry companyName companySize companyLocation isDeleted selectedPlan notificationType stripeCustomerId isExtensionInstalled isCookieExpired cookie publicIdentifier',
        );
        // .lean();
        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'client is not found.',
            });
        }
        if (client.isExtensionInstalled && !client.isCookieExpired && client.cookie) {
            Logger.log.info('Extension installed, so fetching the client profile');
            try {
                let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(client.cookie);
                let clientInfo = await opportunityHelper.getProfile(client.publicIdentifier, cookieStr, ajaxToken);
                client.title = clientInfo.title;
                client.companyName = clientInfo.companyName;
                client.linkedInUrl = clientInfo.linkedInUrl;
                client.companyLocation = clientInfo.location;
                client.profilePicUrl = clientInfo.profilePicUrl;
                await client.save();
                Logger.log.info('Success in fetching client profile from LinkedIn');
            } catch (e) {
                Logger.log.warn('Error in fetching client profile from LinkedIn', e);
            }
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

/**
 * get Client Data
 *
 */
router.get('/get-login-status', authMiddleWare.linkedInLoggedInChecked, async (req, res) => {
    try {
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'Client is logged in.',
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
router.put('/update', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false }).select(
            'firstName lastName email phone title profilePicUrl industry companyName companySize companyLocation isDeleted selectedPlan notificationType stripeCustomerId',
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
 update Notification Types
 */
router.put('/notification-type', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let client = await Client.findOne({ _id: req.client._id, isDeleted: false }).select(
            'firstName lastName email phone title profilePicUrl industry companyName companySize companyLocation isDeleted selectedPlan notificationType stripeCustomerId',
        );
        if (!client) {
            return res.status(400).send({
                status: 'CLIENT_NOT_FOUND',
                message: 'Client is not found.',
            });
        }
        client['notificationType']['email'] = req.body.notificationType.email;
        client['notificationType']['browser'] = req.body.notificationType.browser;

        await client.save();
        return res.status(200).send({
            status: 'SUCCESS',
            data: client,
        });
    } catch (e) {
        Logger.log.error('Error in update notification types for Client API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
 Get Invoices
 */
router.get('/invoices', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);
        let queryObj = {
            clientId: req.client._id,
            isDeleted: false,
        };
        let options = {
            page,
            limit,
            lean: true,
            populate: {
                path: 'paymentId',
                select: { planType: 1 },
            },
            select: {
                paymentId: 1,
                totalAmount: 1,
                createdAt: 1,
                receiptNumber: 1,
                hostUrl: 1,
                downloadUrl: 1,
            },
        };
        if (req.query.startDate && req.query.endDate) {
            let startDate = new Date(req.query.startDate);
            let endDate = new Date(req.query.endDate);
            queryObj.createdAt = { $gte: startDate, $lte: endDate };
        }
        let invoices = await Invoice.paginate(queryObj, options);
        return res.status(200).send({
            status: 'SUCCESS',
            data: invoices,
        });
    } catch (e) {
        Logger.log.error('Error in get Invoices API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
 Download All Invoices
 */
router.get('/invoices-download', authMiddleWare.clientAuthMiddleWare, async (req, res) => {
    try {
        let invoices = await Invoice.find({ clientId: req.client._id, isDeleted: false })
            .select({
                totalAmount: 1,
                createdAt: 1,
                receiptNumber: 1,
                hostUrl: 1,
            })
            .populate({
                path: 'paymentId',
                select: { planType: 1 },
            })
            .lean();
        let fields = ['date', 'amount', 'receipt-number', 'plan-type', 'invoice-url'];
        const rawJson = invoices.map((x) => {
            return {
                date: x.createdAt.toLocaleString(),
                amount: x.totalAmount,
                'receipt-number': x.receiptNumber,
                'plan-type': x.paymentId.planType,
                'invoice-url': x.hostUrl,
            };
        });
        const json2csvParser = new Parser({ fields });
        const csvData = json2csvParser.parse(rawJson);
        res.header('Content-Type', 'text/csv');
        res.send(csvData);
    } catch (e) {
        Logger.log.error('Error in get Invoices API call', e.message || e);
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
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken',
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
            client.selectedPlan.status = client.selectedPlan.planSelected;
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
        let payment = await Payment.findOne({ clientId: req.client._id, isCancelled: false });
        if (!payment) {
            Logger.log.error('Subscription not found for client:', req.client._id);
            return res.status(400).json({
                status: 'SUBSCRIPTION_NOT_FOUND',
                message: 'subscription not found.',
            });
        }
        await stripeHelper.cancelSubscription({ stripeSubscriptionId: payment.stripeSubscriptionId });
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'Subscription cancelled successfully.',
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
        let token = req.header('authorization');
        if (!token) {
            Logger.log.warn('JWT - Auth-Token not set in header for Logout Call');
            return res.status(401).send({ message: 'Auth-Token not set in header' });
        }
        let decoded = jwt.verify(token, config.jwt.secret);
        let updateObj = {
            logoutAllDevicesAt: new Date(),
        };
        if (req.body.fcmToken) {
            updateObj['$pull'] = { fcmToken: req.body.fcmToken };
        }
        await Client.updateOne({ _id: decoded._id }, updateObj);
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

/*
 Add Invited User
 */
router.put('/add-user-as-invited', authMiddleWare.linkedInLoggedInChecked, async (req, res) => {
    try {
        if (!req.body.publicIdentifier) {
            return res.status(400).send({
                status: 'PUBLIC_IDENTIFIER_NOT_FOUND',
                message: 'Public Identifier not found',
            });
        }
        //TODO Add the Business logic here
        // console.log('client.publicIdentifier::', req.client.publicIdentifier);
        // console.log('Add in Invited count::', req.body.publicIdentifier);
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'Public Identifier added successfully',
        });
    } catch (e) {
        Logger.log.error('Error in adding Invited Public Identifier', e.message || e);
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
