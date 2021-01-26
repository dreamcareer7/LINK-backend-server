const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = mongoose.model('conversation');
const Opportunity = mongoose.model('opportunity');
const cookieHelper = require('../helper/cookie.helper');
const conversationHelper = require('../helper/conversation.helper');
const Logger = require('../services/logger');

router.post('/get-conversation-id-arr', async (req, res) => {
    try {
        if (!req.body.conversationIdArr) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'conversationIdArr is Not found.',
            });
        } else if (req.body.conversationIdArr.length < 0) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'conversationIdArr length mustbe greater than 0.',
            });
        }
        let newConversationIdArr = [];

        for (let i = 0; i < req.body.conversationIdArr.length; i++) {
            let conversation = await Conversation.findOne({
                clientId: req.client._id,
                'conversations.conversationId': req.body.conversationIdArr[i],
            });

            if (!conversation) {
                newConversationIdArr.push(req.body.conversationIdArr[i]);
            }
        }
        let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
        let conversation = await conversationHelper.extractChats({
            cookie: cookieStr,
            ajaxToken: ajaxToken,
            newConversationIdArr: newConversationIdArr,
        });
        let dbConversation = await Conversation.findOne({
            clientId: req.client._id,
        });
        for (let i = 0; i < conversation.length; i++) {
            let con = await Conversation.findOneAndUpdate(
                {
                    clientId: req.client._id,
                    'conversations.publicIdentifier': conversation[i].publicIdentifier,
                },
                { $set: { 'conversations.$.conversationId': conversation[i].conversationId } },
                { new: true },
            );
            if (!con) {
                dbConversation.conversations.push({
                    conversationId: conversation[i].conversationId,
                    publicIdentifier: conversation[i].publicIdentifier,
                });
                await dbConversation.save();
            }
        }
        let addedOpportunity = [];

        for (let i = 0; i < dbConversation.conversations.length; i++) {
            let opportunity = await Opportunity.findOne({
                clientId: req.client._id,
                isDeleted: false,
                publicIdentifier: dbConversation.conversations[i].publicIdentifier,
            });
            if (opportunity) {
                addedOpportunity.push(dbConversation.conversations[i].conversationId);
            }
        }
        res.status(200).json({
            status: 'SUCCESS',
            data: addedOpportunity,
        });
    } catch (e) {
        Logger.log.error('Error in  API call', e.message || e);
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
