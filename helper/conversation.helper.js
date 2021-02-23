const Logger = require('../services/logger');
const axios = require('axios');
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Client = mongoose.model('client');

const extractChats = async ({
    cookie,
    ajaxToken,
    newConversationIdArr,
    publicIdentifier,
    publicIdentifiers,
    checkBefore,
}) => {
    try {
        let createdBefore = null;
        let extractedChats = [];
        if (newConversationIdArr) {
            while (newConversationIdArr.length > 0) {
                let rawChatsData = await fetchChats(cookie, ajaxToken, createdBefore);

                let processedChatData = await processChatData(rawChatsData);

                if (processedChatData['chats'].length > 0) {
                    for (let j = 0; j < processedChatData['chats'].length; j++) {
                        if (newConversationIdArr.indexOf(processedChatData['chats'][j].conversationId) !== -1) {
                            newConversationIdArr = newConversationIdArr.filter(
                                (id) => id !== processedChatData['chats'][j].conversationId,
                            );
                            extractedChats.push(processedChatData['chats'][j]);
                        }
                        // for (let i = 0; i < newConversationIdArr.length; i++) {
                        //     if (newConversationIdArr[i] === processedChatData['chats'][j].conversationId) {
                        //         newConversationIdArr.splice(i, 1);
                        //         console.log('processedChatData[chats][j]:', processedChatData['chats'][j]);
                        //         // extractedChats.push(processedChatData['chats'][j]);
                        //         extractedChats = [...extractedChats, processedChatData['chats'][j]];
                        //     }
                        // }
                    }

                    createdBefore = processedChatData['lowestLastActivity'];
                } else {
                    break;
                }
            }
        } else if (publicIdentifier) {
            let chatFound = false;
            while (!chatFound) {
                let rawChatsData = await fetchChats(cookie, ajaxToken, createdBefore);

                let processedChatData = await processChatData(rawChatsData);
                if (processedChatData['chats'].length > 0) {
                    for (let j = 0; j < processedChatData['chats'].length; j++) {
                        if (processedChatData['chats'][j].publicIdentifier === publicIdentifier) {
                            extractedChats.push(processedChatData['chats'][j]);
                            chatFound = true;
                            break;
                        }
                    }

                    createdBefore = processedChatData['lowestLastActivity'];
                } else {
                    break;
                }
            }
        } else if (publicIdentifiers) {
            let chatsFound = [];
            while (publicIdentifiers.length > 0 && (checkBefore < createdBefore || !createdBefore)) {
                console.log('publicIdentifiers::', publicIdentifiers, publicIdentifiers.length);
                console.log(checkBefore, createdBefore);
                let rawChatsData = await fetchChats(cookie, ajaxToken, createdBefore);

                let processedChatData = await processChatData(rawChatsData);
                if (processedChatData['chats'].length > 0) {
                    for (let j = 0; j < processedChatData['chats'].length; j++) {
                        if (publicIdentifiers.indexOf(processedChatData['chats'][j].publicIdentifier) !== -1) {
                            publicIdentifiers.filter((p) => p !== processedChatData['chats'][j].publicIdentifier);
                            console.log(
                                '=====================Matched============================',
                                processedChatData['chats'][j].publicIdentifier,
                            );
                            chatsFound.push({
                                publicIdentifier: processedChatData['chats'][j].publicIdentifier,
                                conversationId: processedChatData['chats'][j].conversationId,
                            });
                        }
                    }
                    createdBefore = processedChatData['lowestLastActivity'];
                } else {
                    break;
                }
            }
            return chatsFound;
        } else {
            while (true) {
                let rawChatsData = await fetchChats(cookie, ajaxToken, createdBefore);

                let processedChatData = await processChatData(rawChatsData);

                if (processedChatData['chats'].length > 0) {
                    extractedChats = [...extractedChats, ...processedChatData['chats']];
                    createdBefore = processedChatData['lowestLastActivity'];
                } else {
                    break;
                }
            }
        }
        return extractedChats;
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
        // console.log('extractedChats::', extractedChats);
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
        // console.log('fetchChats::', JSON.stringify(response.data, null, 3));

        return response.data;
    } catch (e) {
        Logger.log.error('Error in fetch chat.', e.message || e);
        return Promise.reject({ message: 'Error in fetch chat.' });
    }
};

const fetchConversation = async (
    cookie,
    ajaxToken,
    conversationId,
    opportunityPublicIdentifier,
    clientId,
    createdAt,
) => {
    try {
        let url;
        if (!isNaN(createdAt) && createdAt !== '' && createdAt !== null && createdAt !== undefined) {
            url = `https://www.linkedin.com/voyager/api/messaging/conversations/${conversationId}/events?createdBefore=${createdAt}`;
        } else {
            url = `https://www.linkedin.com/voyager/api/messaging/conversations/${conversationId}/events?q=syncToken&reload=true`;
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
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
                'x-li-page-instance': 'urn:li:page:messaging_thread;2yOQNnTKS8yllg7K8byIgw==',
                'x-li-track':
                    '{"clientVersion":"1.7.6872","mpVersion":"1.7.6872","osName":"web","timezoneOffset":5.5,"deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":1,"displayWidth":1920,"displayHeight":1080}',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                referer: `https://www.linkedin.com/messaging/thread/${conversationId}/`,
                'accept-language': 'en-US,en;q=0.9',
                cookie: cookie,
            },
        };

        let response = await axios(data);
        let msg = await processConversation(response.data, opportunityPublicIdentifier, clientId);
        return msg;
    } catch (e) {
        Logger.log.error('Error in fetch Conversation.', e.message || e);
        return Promise.reject({ message: 'Error in fetch Conversation.' });
    }
};

const processConversation = async (response, opportunityPublicIdentifier, clientId) => {
    try {
        let client = await Client.findOne({ _id: clientId, isDeleted: false })
            .select('-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken')
            .lean();
        let opportunity = await Opportunity.findOne({
            clientId: clientId,
            isDeleted: false,
            publicIdentifier: opportunityPublicIdentifier,
        }).lean();
        let obj = {};
        let msgArr = [];
        for (let i = 0; i < response.included.length; i++) {
            if (response.included[i].hasOwnProperty('publicIdentifier')) {
                if (response.included[i].publicIdentifier !== opportunityPublicIdentifier) {
                    obj['1'] = {
                        entityUrn: response.included[i].entityUrn,
                        profilePicUrl: client.hasOwnProperty('profilePicUrl') ? client.profilePicUrl : null,
                    };
                } else {
                    obj['2'] = {
                        entityUrn: response.included[i].entityUrn,
                        profilePicUrl: opportunity.hasOwnProperty('profilePicUrl') ? opportunity.profilePicUrl : null,
                    };
                }
            }
            if (response.included[i].hasOwnProperty('nameInitials')) {
                for (let key in obj) {
                    if (obj[key].entityUrn === response.included[i]['*miniProfile']) {
                        obj[key].entityUrn = response.included[i].entityUrn;
                    }
                }
            }
        }

        for (let i = 0; i < response.included.length; i++) {
            let messageObj = {};
            if (response.included[i].hasOwnProperty('*from')) {
                for (let key in obj) {
                    if (obj[key].entityUrn === response.included[i]['*from']) {
                        messageObj.id = key;
                        messageObj.profilePicUrl = obj[key].profilePicUrl;
                        messageObj.message = response.included[i].eventContent.attributedBody.text;
                        messageObj.createdAt = response.included[i].createdAt;
                        msgArr.push(messageObj);
                    }
                }
            }
        }

        msgArr.sort(function(a, b) {
            return a.createdAt - b.createdAt;
        });

        return msgArr;
    } catch (e) {
        Logger.log.error('Error in process Conversation.', e.message || e);
        return Promise.reject({ message: 'Error in process Conversation.' });
    }
};

module.exports = {
    extractChats: extractChats,
    fetchConversation,
};
