const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Conversation = mongoose.model('conversation');
const Logger = require('../services/logger');
const opportunityHelper = require('../helper/opportunity.helper');
const cookieHelper = require('../helper/cookie.helper');
const firebaseHelper = require('../helper/firebase-notification');
const conversationHelper = require('../helper/conversation.helper');
const authMiddleWare = require('../middleware/authenticate');
const socketHelper = require('../helper/socket.helper');

/**
 * add opportunity
 */
router.post('/add-opportunity', authMiddleWare.linkedInLoggedInChecked, async (req, res) => {
    try {
        if (req.body.publicIdentifier) {
            let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
            let opportunityData = await opportunityHelper.getProfile(req.body.publicIdentifier, cookieStr, ajaxToken);
            let contactInfo = await opportunityHelper.getContactInfo(req.body.publicIdentifier, cookieStr, ajaxToken);
            opportunityData = { ...opportunityData, ...contactInfo };
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
                opportunityData.stageLogs = [];
                let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
                let conversation = await conversationHelper.extractChats({
                    cookie: cookieStr,
                    ajaxToken: ajaxToken,
                    publicIdentifier: req.body.publicIdentifier,
                });
                opportunity = new Opportunity(opportunityData);
                await opportunity.save();
                let salesNavigatorChatId = await conversationHelper.getSalesNavigatorChatId({
                    cookie: cookieStr,
                    ajaxToken: ajaxToken,
                    publicIdentifier: req.body.publicIdentifier,
                });
                Logger.log.info('salesNavigatorChatId response in the route', salesNavigatorChatId);
                if (salesNavigatorChatId) {
                    let dbConversation = await Conversation.findOne({
                        clientId: req.client._id,
                    });
                    if (dbConversation) {
                        let i = 0;
                        for (i = 0; i < dbConversation.conversations.length; i++) {
                            if (dbConversation.conversations[i].publicIdentifier === req.body.publicIdentifier) {
                                dbConversation.conversations[i].salesNavigatorId = salesNavigatorChatId;
                                await dbConversation.save();
                                break;
                            }
                        }
                        if (i === dbConversation.conversations.length) {
                            dbConversation.conversations.push({
                                publicIdentifier: req.body.publicIdentifier,
                                salesNavigatorId: salesNavigatorChatId,
                            });
                            await dbConversation.save();
                        }
                    }
                }
                Logger.log.info('New Opportunity added.');
            }
            return res.status(200).send({
                status: 'SUCCESS',
                data: opportunity,
            });
        } else if (req.body.conversationId) {
            let publicIdentifier;
            let dbConversation = await Conversation.findOne({
                clientId: req.client._id,
                'conversations.conversationId': req.body.conversationId,
            });

            if (!dbConversation) {
                return res.status(400).send({
                    status: 'NOT_FOUND',
                    message: 'ConversationId is Not Found in db.',
                });
            }

            for (let i = 0; i < dbConversation.conversations.length; i++) {
                if (dbConversation.conversations[i].conversationId == req.body.conversationId) {
                    publicIdentifier = dbConversation.conversations[i].publicIdentifier;
                    break;
                }
            }

            let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
            let opportunityData = await opportunityHelper.getProfile(publicIdentifier, cookieStr, ajaxToken);
            let contactInfo = await opportunityHelper.getContactInfo(req.body.publicIdentifier, cookieStr, ajaxToken);
            opportunityData = { ...opportunityData, ...contactInfo };
            opportunityData.clientId = req.client._id;
            let opportunity = await Opportunity.findOne({
                clientId: req.client._id,
                isDeleted: false,
                publicIdentifier: publicIdentifier,
            });

            if (opportunity) {
                opportunity = await Opportunity.findOneAndUpdate(
                    { clientId: req.client._id, isDeleted: false, publicIdentifier: publicIdentifier },
                    opportunityData,
                    { new: true },
                );
                Logger.log.info('Opportunity updated.');
            } else {
                opportunityData.stageLogs = [
                    // {
                    //     value: 'INITIAL_CONTACT',
                    //     changedAt: new Date(),
                    // },
                ];
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

router.put('/fetch-conversation/:id', async (req, res) => {
    try {
        let chatFor = req.query.chatFor;
        let opportunity = await Opportunity.findOne({ _id: req.params.id, clientId: req.client._id, isDeleted: false });
        if (!opportunity) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunitys is not Found!',
            });
        }
        let dbConversation = await Conversation.findOne({
            clientId: req.client._id,
            'conversations.publicIdentifier': opportunity.publicIdentifier,
            isDeleted: false,
        });
        let isConversationIdPresent = true;
        if (!dbConversation) {
            if (chatFor === 'SALES_NAVIGATOR') {
                let salesNavigatorChatId = await conversationHelper.getSalesNavigatorChatId({
                    cookie: cookieStr,
                    ajaxToken: ajaxToken,
                    publicIdentifier: req.body.publicIdentifier,
                });
                if (!salesNavigatorChatId) {
                    Logger.log.info('No Sales Navigator chat found with the given user');
                    return res.status(200).send({
                        status: 'SUCCESS',
                        data: [],
                    });
                } else {
                    Logger.log.info("Conversation wasn't present, adding it.");
                    dbConversation = await Conversation.findOne({
                        clientId: req.client._id,
                        isDeleted: false,
                    });
                    if (!dbConversation) {
                        dbConversation = new Conversation({
                            clientId: req.client._id,
                            conversations: [
                                {
                                    salesNavigatorId: salesNavigatorChatId,
                                    publicIdentifier: req.body.publicIdentifier,
                                },
                            ],
                        });
                        await dbConversation.save();
                    } else {
                        let i = 0;
                        for (i = 0; i < dbConversation.conversations.length; i++) {
                            if (dbConversation.conversations[i].publicIdentifier === req.body.publicIdentifier) {
                                dbConversation.conversations[i].salesNavigatorId = salesNavigatorChatId;
                                await dbConversation.save();
                                break;
                            }
                        }
                        if (i === dbConversation.conversations.length) {
                            dbConversation.conversations.push({
                                publicIdentifier: req.body.publicIdentifier,
                                salesNavigatorId: salesNavigatorChatId,
                            });
                            await dbConversation.save();
                        }
                    }
                }
            } else {
                console.log('Calling for getting linkedin chat without chat in db...');
                isConversationIdPresent = false;
                let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
                let conversation = await conversationHelper.extractChats({
                    cookie: cookieStr,
                    ajaxToken: ajaxToken,
                    publicIdentifier: opportunity.publicIdentifier,
                });
                if (conversation.length === 0) {
                    return res.status(200).send({
                        status: 'SUCCESS',
                        data: [],
                    });
                }
                Logger.log.info("Conversation wasn't present, adding it.");
                dbConversation = await Conversation.findOne({
                    clientId: req.client._id,
                    isDeleted: false,
                });
                if (!dbConversation) {
                    dbConversation = new Conversation({
                        clientId: req.client._id,
                        conversations: [
                            {
                                conversationId: conversation[0].conversationId,
                                publicIdentifier: conversation[0].publicIdentifier,
                            },
                        ],
                    });
                    await dbConversation.save();
                } else {
                    let i = 0;
                    for (i = 0; i < dbConversation.conversations.length; i++) {
                        if (dbConversation.conversations[i].publicIdentifier === req.body.publicIdentifier) {
                            dbConversation.conversations[i].conversationId = conversation[0].conversationId;
                            await dbConversation.save();
                            break;
                        }
                    }
                    if (i === dbConversation.conversations.length) {
                        dbConversation.conversations.push({
                            publicIdentifier: conversation[0].publicIdentifier,
                            conversationId: conversation[0].conversationId,
                        });
                        await dbConversation.save();
                    }
                }
            }
        }
        let conversationId;
        let salesNavigatorChatId;
        let publicIdentifier;
        for (let i = 0; i < dbConversation.conversations.length; i++) {
            if (dbConversation.conversations[i].publicIdentifier === opportunity.publicIdentifier) {
                publicIdentifier = dbConversation.conversations[i].publicIdentifier;
                if (chatFor === 'SALES_NAVIGATOR') {
                    salesNavigatorChatId = dbConversation.conversations[i].salesNavigatorId;
                } else {
                    conversationId = dbConversation.conversations[i].conversationId;
                }
                break;
            }
        }
        let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
        let conversationData;
        if (chatFor === 'SALES_NAVIGATOR') {
            conversationData = await conversationHelper.fetchSalesNavigatorConversation(
                cookieStr,
                ajaxToken,
                '2-YmQwMDA4MTQtYzgxNi00OTU3LWJmOWEtOTAzMGU1MzJmMTZkXzAxMg==',
                publicIdentifier,
                req.client._id,
                req.body.createdAt,
            );
        } else {
            console.log('Calling for getting linkedin chat finally...');
            conversationData = await conversationHelper.fetchConversation(
                cookieStr,
                ajaxToken,
                conversationId,
                publicIdentifier,
                req.client._id,
                req.body.createdAt,
            );
            if (!req.body.createdAt && conversationData.length === 0) {
                Logger.log.info('Checking if new conversation is performed for', opportunity.publicIdentifier);
                let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
                let conversation = await conversationHelper.extractChats({
                    cookie: cookieStr,
                    ajaxToken: ajaxToken,
                    publicIdentifier: opportunity.publicIdentifier,
                });
                if (dbConversation && dbConversation.conversations) {
                    if (conversation && conversation.length !== 0) {
                        Logger.log.info('New conversation is performed for', opportunity.publicIdentifier);
                        for (let i = 0; i < dbConversation.conversations.length; i++) {
                            if (dbConversation.conversations[i].publicIdentifier === conversation[0].publicIdentifier) {
                                dbConversation.conversations[i].conversationId = conversation[0].conversationId;
                                conversationId = conversation[0].conversationId;
                                await dbConversation.save();
                                break;
                            }
                        }
                        conversationData = await conversationHelper.fetchConversation(
                            cookieStr,
                            ajaxToken,
                            conversationId,
                            publicIdentifier,
                            req.client._id,
                            req.body.createdAt,
                        );
                    } else {
                        Logger.log.info(
                            `New conversation is not performed for ${opportunity.publicIdentifier}, hence removing it.`,
                        );
                        for (let i = 0; i < dbConversation.conversations.length; i++) {
                            if (
                                dbConversation.conversations[i].publicIdentifier === opportunity.publicIdentifier &&
                                !dbConversation.conversations[i].salesNavigatorId
                            ) {
                                dbConversation.conversations.splice(i, 1);
                                await dbConversation.save();
                                break;
                            }
                        }
                        dbConversation.conversations = dbConversation.conversations.filter(
                            (c) => c.publicIdentifier !== opportunity.publicIdentifier,
                        );
                        await dbConversation.save();
                    }
                }
            }
        }
        let changeStageToInConversation = false;
        if (
            conversationData &&
            conversationData.length > 0 &&
            opportunity.stage === 'INITIAL_CONTACT' &&
            opportunity.stageLogs.length === 1
        ) {
            opportunity.stage = 'IN_CONVERSION';
            opportunity.stageLogs.push({
                value: 'IN_CONVERSION',
                changedAt: new Date(),
            });
            await opportunity.save();
            changeStageToInConversation = true;
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: conversationData,
            changeStageToInConversation,
        });
    } catch (e) {
        req.client.isCookieExpired = true;
        await req.client.save();
        Logger.log.error('Error in fetch-conversation API call.', e.message || e);
        res.status(500).json({
            status: 'READ_ERROR_MESSAGE',
            message: 'cookie_expired',
        });
    }
});

/**
 * update opportunity
 */
router.put('/update-opportunity/:id', async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Require field is Missing.',
            });
        }
        let opportunity = await Opportunity.findOne({ _id: req.params.id, clientId: req.client._id, isDeleted: false });
        if (!opportunity.isSaved) {
            req.body.isSaved = true;
            socketHelper.sendNotification({
                notificationObj: {
                    publicIdentifier: opportunity.publicIdentifier,
                    buttonText: 'Update Opportunity',
                },
                clientId: req.client._id,
                requestFor: 'extension',
            });
        }
        if (opportunity.stage !== req.body.stage) {
            req.body.stageLogs = opportunity.stageLogs;
            req.body.stageLogs.push({
                value: req.body.stage,
                changedAt: new Date(),
            });
        }
        opportunity = await Opportunity.findOneAndUpdate(
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

/**
 * get opportunity
 */
router.put('/get-opportunity', authMiddleWare.linkedInLoggedInChecked, async (req, res) => {
    try {
        let opportunitys = await Opportunity.find({
            clientId: req.client._id,
            isDeleted: false,
            isSaved: true,
            publicIdentifier: { $in: req.body.publicIdentifierArr },
        }).select('publicIdentifier -_id');

        opportunitys = opportunitys.map((opportunitys) => opportunitys.publicIdentifier);
        return res.status(200).send({
            status: 'SUCCESS',
            data: opportunitys,
        });
    } catch (e) {
        Logger.log.error('Error in get opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * delete opportunity
 */
router.delete('/delete-opportunity/:id', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOneAndUpdate(
            { _id: req.params.id, clientId: req.client._id, isDeleted: false },
            { isDeleted: true },
            { new: true },
        );
        if (opportunity) {
            socketHelper.sendNotification({
                notificationObj: {
                    publicIdentifier: opportunity.publicIdentifier,
                    buttonText: 'Add Opportunity',
                },
                clientId: req.client._id,
                requestFor: 'extension',
            });
            return res.status(200).json({
                status: 'SUCCESS',
                message: 'opportunitys is Deleted Successfully.',
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

/**
 * sync with linkedIn opportunity by jayla app
 */

router.post('/sync-with-linkedIn/:id', authMiddleWare.linkedInLoggedInChecked, async (req, res) => {
    try {
        let opportunity = await Opportunity.findOne({ _id: req.params.id, clientId: req.client._id, isDeleted: false });
        if (!opportunity) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunitys is not Found!',
            });
        }
        let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
        opportunityData = await opportunityHelper.getProfile(opportunity.publicIdentifier, cookieStr, ajaxToken);
        let contactInfo = await opportunityHelper.getContactInfo(opportunity.publicIdentifier, cookieStr, ajaxToken);
        opportunityData = { ...opportunityData, ...contactInfo };
        opportunity = await Opportunity.findOneAndUpdate(
            { _id: req.params.id, clientId: req.client._id, isDeleted: false },
            opportunityData,
            { new: true },
        );
        return res.status(200).json({
            status: 'SUCCESS',
            data: opportunity,
        });
    } catch (e) {
        req.client.isCookieExpired = true;
        await req.client.save();
        Logger.log.error('Error in sync with linkedIn API call.', e.message || e);
        res.status(500).json({
            status: 'READ_ERROR_MESSAGE',
            message: 'cookie_expired',
        });
    }
});

/**
 * Send Opportunity Notifications
 */

router.post('/send-notifications/:id', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOne({ _id: req.params.id, clientId: req.client._id, isDeleted: false });
        if (!opportunity) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunitys is not Found!',
            });
        }
        firebaseHelper.sendNotification({
            tokens: req.client.fcmToken,
            data: { notificationFor: 'OPPORTUNITY_FOLLOWUP', data: opportunity },
        });
        return res.status(200).json({
            status: 'SUCCESS',
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
 * get opportunity by Id
 */

router.get('/get-opportunity/:id', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOne({ _id: req.params.id, clientId: req.client._id, isDeleted: false });

        if (opportunity) {
            if (!opportunity.isVisited) {
                opportunity.isVisited = true;
                await opportunity.save();
                opportunity.isVisited = false;
            }
            return res.status(200).send({
                status: 'SUCCESS',
                data: opportunity,
            });
        } else {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Opportunitys  is Not found.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in get opportunity by Id API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * search-opportunity
 */

router.put('/search-opportunity', async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).send({
                status: 'ERROR',
                message: 'name is required in body.',
            });
        }

        let name = req.body.name
            .replace(/  +/g, ' ')
            .split(' ')
            .slice(0, 2);

        let opportunity = await Opportunity.find({
            clientId: req.client._id,
            isDeleted: false,
            isSaved: true,

            $or: [
                { $and: [{ firstName: new RegExp(name[0], 'i') }, { lastName: new RegExp(name[1], 'i') }] },
                { $and: [{ firstName: new RegExp(name[1], 'i') }, { lastName: new RegExp(name[0], 'i') }] },
            ],
        });
        if (opportunity) {
            return res.status(200).send({
                status: 'SUCCESS',
                data: opportunity,
            });
        } else {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Opportunitys is Not found.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in search-opportunity API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 *client-follow-ups filters
 */

router.put('/get-opportunity-with-prev-next', async (req, res) => {
    try {
        let momentDate = moment().tz('Australia/Melbourne');
        momentDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        momentDate.toISOString();
        momentDate = momentDate.format();
        let today = momentDate;
        let matchPipeline = {
            clientId: req.client._id,
            isDeleted: false,
            isSaved: true,
            followUp: { $exists: true, $ne: null },
        };

        if (req.body.stages.length > 0) {
            let otherStages = req.body.stages;
            let lostClosedStages = [];
            if (otherStages.indexOf('LOST') === -1) {
                lostClosedStages.push('LOST');
            }
            if (otherStages.indexOf('CLOSED') === -1) {
                lostClosedStages.push('CLOSED');
            }
            matchPipeline.stage = { $in: req.body.stages, $nin: [] };
            matchPipeline['$or'] = [
                { stage: { $in: lostClosedStages }, followUp: { $gt: new Date(today) } },
                { stage: { $in: otherStages } },
            ];
        } else {
            matchPipeline['$or'] = [
                { stage: { $in: ['CLOSED', 'LOST'] }, followUp: { $gt: new Date(today) } },
                { stage: { $in: ['INITIAL_CONTACT', 'IN_CONVERSION', 'MEETING_BOOKED', 'FOLLOW_UP', 'POTENTIAL'] } },
            ];
        }
        if (req.body.likelyHoods.length > 0) {
            matchPipeline.likelyHood = { $in: req.body.likelyHoods };
        }
        if (req.body.startDeal && req.body.endDeal) {
            matchPipeline.dealSize = {
                $gte: req.body.startDeal,
                $lte: req.body.endDeal,
            };
        }
        if (req.body.endDate && req.body.startDate) {
            matchPipeline.followUp = {
                $gte: new Date(req.body.startDate),
                $lte: new Date(req.body.endDate),
            };
        }
        let promiseArr = [];
        promiseArr.push(
            Opportunity.aggregate([
                {
                    $match: matchPipeline,
                },
                {
                    $sort: {
                        followUp: 1,
                        firstName: 1,
                        lastName: 1,
                    },
                },
                {
                    $group: {
                        _id: '$clientId',
                        opportunityIds: {
                            $push: '$_id',
                        },
                    },
                },
            ]).allowDiskUse(true),
        );
        promiseArr.push(Opportunity.findOne({ _id: req.body.currentOpportunityId }));
        let data = await Promise.all(promiseArr);
        if (!data[1].isVisited) {
            data[1].isVisited = true;
            await data[1].save();
            data[1].isVisited = false;
        }
        let prevId;
        let nextId;
        if (data[0] && data[0][0] && data[0][0].opportunityIds && data[0][0].opportunityIds.length > 1) {
            data[0][0].opportunityIds = data[0][0].opportunityIds.map((x) => x.toString());
            const currentIndex = data[0][0].opportunityIds.indexOf(req.body.currentOpportunityId);
            if (currentIndex !== 0) {
                prevId = data[0][0].opportunityIds[currentIndex - 1];
            }
            if (currentIndex !== data[0][0].opportunityIds.length - 1) {
                nextId = data[0][0].opportunityIds[currentIndex + 1];
            }
        }
        res.status(200).send({
            status: 'SUCCESS',
            data: {
                prevId,
                nextId,
                ...JSON.parse(JSON.stringify(data[1])),
            },
        });
    } catch (e) {
        Logger.log.error('Error client-follow-ups filters in  API.', e.message || e);
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
