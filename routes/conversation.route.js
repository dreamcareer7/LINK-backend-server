const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = mongoose.model('conversation');
const cookieHelper = require('../helper/cookie.helper');
const conversationHelper = require('../helper/conversation.helper');
const Logger = require('../services/logger');

router.get('/', async (req, res) => {
    try {
        let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(req.client.cookie);
        let conversation = await conversationHelper.extract_chats(cookieStr, ajaxToken);
        res.status(200).json({
            status: 'SUCCESS',
            data: conversation,
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
