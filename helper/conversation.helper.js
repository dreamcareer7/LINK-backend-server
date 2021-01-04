const Logger = require('../services/logger');
const axios = require('axios');

const extractChats = async (cookie, ajaxToken, newConversationIdArr) => {
    try {
        let createdBefore = null;
        let extractedChats = [];
        if (!newConversationIdArr) {
            while (true) {
                let rawChatsData = await fetchChats(cookie, ajaxToken, createdBefore);

                let processedChatData = await processChatData(rawChatsData);

                if (processedChatData['chats'].length > 0) {
                    extractedChats.push(processedChatData['chats']);
                    createdBefore = processedChatData['lowestLastActivity'];
                } else {
                    break;
                }
            }
        } else {
            while (newConversationIdArr.length > 0) {
                let rawChatsData = await fetchChats(cookie, ajaxToken, createdBefore);

                let processedChatData = await processChatData(rawChatsData);

                if (processedChatData['chats'].length > 0) {
                    for (let j = 0; j < processedChatData['chats'].length; j++) {
                        for (let i = 0; i < newConversationIdArr.length; i++) {
                            if (newConversationIdArr[i] === processedChatData['chats'][j].conversationId) {
                                newConversationIdArr.splice(i, 1);
                                extractedChats.push(processedChatData['chats'][j]);
                            }
                        }
                    }

                    createdBefore = processedChatData['lowestLastActivity'];
                } else {
                    break;
                }
            }
        }
        return extractedChats.flat();
    } catch (e) {
        Logger.log.error('Error in extractChats.', e.message || e);
        return Promise.reject({ message: 'Error in extractChats.' });
    }
};

const processChatData = async (rawChatsData) => {
    try {
        let extractedChats = [];
        let rawChats = {};
        let lastActivities = {};
        let entityUrns = {};
        let lowestLastActivity = 0;
        let rawData = rawChatsData['included'];

        rawData.forEach((item) => {
            let itemType = item['$type'];

            if (itemType === 'com.linkedin.voyager.identity.shared.MiniProfile') {
                rawChats[item['entityUrn']] = {
                    firstName: item['firstName'],
                    lastName: item['lastName'],
                    occupation: item['occupation'],
                    publicIdentifier: item['publicIdentifier'],
                    entityUrn: item['entityUrn'],
                    trackingId: item['trackingId'],
                    $type: item['$type'],
                };
            } else if (itemType === 'com.linkedin.voyager.entities.shared.MiniCompany') {
                rawChats[item['entityUrn']] = {
                    name: item['name'],
                    universalName: item['universalName'],
                    entityUrn: item['entityUrn'],
                    trackingId: item['trackingId'],
                    $type: item['$type'],
                };
            } else if (itemType === 'com.linkedin.voyager.messaging.Conversation') {
                lastActivities[item['*participants'][0]] = {
                    lastActivityAt: item['lastActivityAt'],
                };
                if (lowestLastActivity === 0 || lowestLastActivity > item['lastActivityAt']) {
                    lowestLastActivity = item['lastActivityAt'];
                }
            } else if (itemType === 'com.linkedin.voyager.messaging.MessagingMember') {
                conversationId = item['entityUrn'].split('fs_messagingMember:(')[1].split(',')[0];
                entityUrns[item['*miniProfile']] = {
                    entityUrn: item['entityUrn'],
                    conversationId: conversationId,
                };
            } else if (itemType === 'com.linkedin.voyager.messaging.MessagingCompany') {
                conversationId = item['entityUrn'].split('fs_messagingCompany:(')[1].split(',')[0];
                entityUrns[item['*miniCompany']] = {
                    entityUrn: item['entityUrn'],
                    conversationId: conversationId,
                };
            }
        });

        for (let chatId in rawChats) {
            try {
                tempKey = entityUrns[rawChats[chatId]['entityUrn']]['entityUrn'];
            } catch (e) {
                continue;
            }
            if (lastActivities.hasOwnProperty(tempKey)) {
                let chat = rawChats[chatId];
                chat['lastActivityAt'] = lastActivities[tempKey]['lastActivityAt'];
                chat['conversationId'] = entityUrns[rawChats[chatId]['entityUrn']]['conversationId'];
                extractedChats.push(chat);
            }
        }

        return {
            chats: extractedChats,
            lowestLastActivity: lowestLastActivity,
        };
    } catch (e) {
        Logger.log.error('Error in processChatData.', e.message || e);
        return Promise.reject({ message: 'Error in processChatData.' });
    }
};
const fetchChats = async (cookie, ajaxToken, createdBefore) => {
    try {
        if (createdBefore === null) {
            url =
                'https://www.linkedin.com/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX&count=20&q=syncToken';
        } else {
            url = `https://www.linkedin.com/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX&createdBefore=${createdBefore}`;
        }
        let data = {
            method: 'GET',
            url: url,

            headers: {
                authority: 'www.linkedin.com',
                accept: 'application/vnd.linkedin.normalized+json+2.1',
                'csrf-token': ajaxToken,
                'x-restli-protocol-version': '2.0.0',
                'x-li-lang': 'en_US',
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36',
                'x-li-page-instance': 'urn:li:page:d_flagship3_feed;JStnYvsWTxOQvapMkB1aeQ==',
                'x-li-track':
                    '{"clientVersion":"1.7.5925","mpVersion":"1.7.5925","osName":"web","timezoneOffset":5.5,deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":0.800000011920929,displayWidth":1920,"displayHeight":1080}',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                referer: 'https://www.linkedin.com/feed/',
                'accept-language': 'en-US,en;q=0.9',
                cookie: cookie,
            },
        };

        let response = await axios(data);

        return response.data;
    } catch (e) {
        Logger.log.error('Error in fetch chat.', e.message || e);
        return Promise.reject({ message: 'Error in fetch chat.' });
    }
};

module.exports = {
    extractChats,
};
