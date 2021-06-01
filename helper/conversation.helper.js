const Logger = require('../services/logger');
const axios = require('axios');
const cron = require('node-cron');
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Client = mongoose.model('client');
const Conversation = mongoose.model('conversation');
const cookieHelper = require('./cookie.helper');

//*Extract list of LinkedIn Chats*/
const extractChats = async ({
    cookie,
    ajaxToken,
    newConversationIdArr,
    publicIdentifier,
    publicIdentifiers,
    checkBefore,
    checkUntil,
    isForCron = false,
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
                let rawChatsData = await fetchChats(cookie, ajaxToken, createdBefore);

                let processedChatData = await processChatData(rawChatsData);
                if (processedChatData['chats'].length > 0) {
                    for (let j = 0; j < processedChatData['chats'].length; j++) {
                        if (publicIdentifiers.indexOf(processedChatData['chats'][j].publicIdentifier) !== -1) {
                            publicIdentifiers.filter((p) => p !== processedChatData['chats'][j].publicIdentifier);
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
            while (!isForCron || (isForCron && (checkUntil <= createdBefore || !createdBefore))) {
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

//*Processes fetched list of LinkedIn Chats*/
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

//*Fetches list of LinkedIn Chats*/
const fetchChats = async (cookie, ajaxToken, createdBefore) => {
    try {
        const chatCount = 20;
        if (createdBefore === null) {
            url = `https://www.linkedin.com/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX&count=${chatCount}&q=syncToken`;
        } else {
            url = `https://www.linkedin.com/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX&count=${chatCount}&createdBefore=${createdBefore}`;
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
        if (e.message && e.message.includes('Request failed with status code 400')) {
            Logger.log.error('Chat not found.');
            return { included: [] };
        }
        return Promise.reject({ message: 'Error in fetch chat.' });
    }
};

//*Fetches single LinkedIn Chat*/
const fetchConversation = async (
    cookie,
    ajaxToken,
    conversationId,
    opportunityPublicIdentifier,
    clientId,
    createdAt,
) => {
    try {
        // console.log('getting the chat...', cookie, ajaxToken, conversationId);
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

        // console.log('req data::', data);
        let response = await axios(data);
        // console.log('received the chat', response.data);
        let msg = await processConversation(response.data, opportunityPublicIdentifier, clientId);
        return msg;
    } catch (e) {
        Logger.log.error('Error in fetch Conversation.', e.message || e);
        if (e.message && e.message.includes('Request failed with status code 500')) {
            Logger.log.error('Returned 500');
            return [];
        }
        return Promise.reject({ message: 'Error in fetch Conversation.' });
    }
};

//*Fetches single LinkedIn Chat*/
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

//*Extract Sales navigator chat of LinkedIn Chats*/
const getSalesNavigatorChatId = async ({ cookie, ajaxToken, publicIdentifier, reqFrom }) => {
    try {
        let createdBefore = null;
        let salesNavigatorChatId = '';
        let chatFound = false;
        while (!chatFound) {
            let rawChatsData = await fetchSalesNavigatorChats(cookie, ajaxToken, createdBefore);

            let processedResponse = await identifySalesNavigatorConversationId(rawChatsData, publicIdentifier);
            if (processedResponse.chatId) {
                salesNavigatorChatId = processedResponse.chatId;
                Logger.log.info('Conversation found with', publicIdentifier, salesNavigatorChatId);
                break;
            } else if (processedResponse.chatId) {
                createdBefore = processedResponse.nextPageStartsAt;
                Logger.log.info('Other conversations found, not with this one', publicIdentifier);
            } else {
                Logger.log.info('All the chats are processed, no conversation found with:', publicIdentifier);
                break;
            }
        }
        return salesNavigatorChatId;
    } catch (e) {
        Logger.log.error('Error in extractSalesNavigatorChats.', e.message || e);
        if (reqFrom === 'ADD_OPPORTUNITY') {
            return '';
        } else {
            return Promise.reject({ message: 'Error in Extract Chats from Sales Navigator' });
        }
    }
};

//*Processes fetched list of LinkedIn Chats*/
const identifySalesNavigatorConversationId = async (rawChatsData, publicIdentifier) => {
    try {
        let rawChats = rawChatsData['data']['elements'];
        let rawData = rawChatsData['included'];
        let nextPageStartsAt;
        let chatId;
        rawData.forEach((item) => {
            let itemType = item['$type'];
            if (itemType === 'com.linkedin.sales.profile.Profile' && item['flagshipProfileUrl']) {
                if (item['flagshipProfileUrl'].includes(publicIdentifier)) {
                    const profileEntityUrn = item['entityUrn'];
                    // console.log('Profile URL::', profileEntityUrn);
                    const chat = rawChats.filter(
                        (c) => c.participants && c.participants.indexOf(profileEntityUrn) !== -1,
                    );
                    if (chat && chat.length !== 0) {
                        chatId = chat[0]['id'];
                    }
                }
            }
        });
        if (!chatId) {
            nextPageStartsAt = rawChats[rawChats.length - 1]['nextPageStartsAt'];
            for (let i = 0; i < rawChats.length; i++) {
                if (
                    rawChats[i] &&
                    rawChats[i]['nextPageStartsAt'] &&
                    rawChats[i]['nextPageStartsAt'] < nextPageStartsAt
                ) {
                    nextPageStartsAt = rawChats[i]['nextPageStartsAt'];
                }
            }
        }
        return {
            chatId,
            nextPageStartsAt,
        };
    } catch (e) {
        Logger.log.error('Error in processSalesNavigatorChatData.', e.message || e);
        return Promise.reject({ message: 'Error in processSalesNavigatorChatData.' });
    }
};

//*Fetches list of LinkedIn Chats*/
const fetchSalesNavigatorChats = async (cookie, ajaxToken, createdBefore) => {
    try {
        const chatCount = 20;
        if (createdBefore === null) {
            url = `https://www.linkedin.com/sales-api/salesApiMessagingThreads?decoration=%28id%2Crestrictions%2Carchived%2CunreadMessageCount%2CnextPageStartsAt%2CtotalMessageCount%2Cmessages*%28id%2Ctype%2CcontentFlag%2CdeliveredAt%2ClastEditedAt%2Csubject%2Cbody%2CfooterText%2CblockCopy%2Cattachments%2Cauthor%2CsystemMessageContent%29%2Cparticipants*~fs_salesProfile%28entityUrn%2CfirstName%2ClastName%2CflagshipProfileUrl%2CfullName%2Cdegree%2CprofilePictureDisplayImage%29%29&count=${chatCount}&filter=INBOX&q=filter`;
        } else {
            url = `https://www.linkedin.com/sales-api/salesApiMessagingThreads?decoration=%28id%2Crestrictions%2Carchived%2CunreadMessageCount%2CnextPageStartsAt%2CtotalMessageCount%2Cmessages*%28id%2Ctype%2CcontentFlag%2CdeliveredAt%2ClastEditedAt%2Csubject%2Cbody%2CfooterText%2CblockCopy%2Cattachments%2Cauthor%2CsystemMessageContent%29%2Cparticipants*~fs_salesProfile%28entityUrn%2CfirstName%2ClastName%2CflagshipProfileUrl%2CfullName%2Cdegree%2CprofilePictureDisplayImage%29%29&count=${chatCount}&filter=INBOX&q=filter&pageStartsAt=${createdBefore}`;
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
                referer: 'https://www.linkedin.com/sales/lists/people',
                'accept-language': 'en-US,en;q=0.9',
                cookie: cookie,
            },
        };
        // console.log('REQ DATA::', JSON.stringify(data, null, 3));
        let response = await axios(data);
        // console.log(
        //     'Response received for the Sales navigator list of the chats::',
        //     JSON.stringify(response.data, null, 3),
        // );
        return response.data;
    } catch (e) {
        Logger.log.error('Error in fetch SalesNavigator chat.', e.message || e);
        // console.log(e);
        if (e.message && e.message.includes('Request failed with status code 400')) {
            Logger.log.error('Chat not found.');
            return { included: [] };
        }
        return Promise.reject({ message: 'Error in fetch SalesNavigator chat.' });
    }
};

//*Fetches single LinkedIn Chat*/
const fetchSalesNavigatorConversation = async (
    cookie,
    ajaxToken,
    conversationId,
    opportunityPublicIdentifier,
    clientId,
    createdAt,
    salesNavigatorObj,
) => {
    // console.log('in fetchSalesNavigatorConversation::', conversationId, ajaxToken, cookie);
    try {
        let url;
        let isCreatedAtReceived = false;
        if (!isNaN(createdAt) && createdAt !== '' && createdAt !== null && createdAt !== undefined) {
            isCreatedAtReceived = true;
            url = `https://www.linkedin.com/sales-api/salesApiMessagingThreads/${conversationId}/messages?decoration=%28id%2Ctype%2Cauthor%2Cattachments%2CcontentFlag%2CdeliveredAt%2Csubject%2Cbody%2CfooterText%2CblockCopy%2CsystemMessageContent%29&count=10&deliveredBefore=${createdAt}`;
        } else {
            url = `https://www.linkedin.com/sales-api/salesApiMessagingThreads/${conversationId}?decoration=%28id%2Crestrictions%2Carchived%2CunreadMessageCount%2CnextPageStartsAt%2CtotalMessageCount%2Cmessages*%28id%2Ctype%2CcontentFlag%2CdeliveredAt%2ClastEditedAt%2Csubject%2Cbody%2CfooterText%2CblockCopy%2Cattachments%2Cauthor%2CsystemMessageContent%29%2Cparticipants*~fs_salesProfile%28entityUrn%2CfirstName%2ClastName%2CflagshipProfileUrl%2CfullName%2Cdegree%2CprofilePictureDisplayImage%29%29&count=1&messageCount=10`;
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
                referer: `https://www.linkedin.com/sales/inbox/${conversationId}`,
                'accept-language': 'en-US,en;q=0.9',
                cookie: cookie,
            },
        };

        let response = await axios(data);
        // console.log('response from linkedIn::', response.data);
        let msg = await processSalesNavigatorConversation(
            response.data,
            opportunityPublicIdentifier,
            clientId,
            isCreatedAtReceived,
            salesNavigatorObj,
        );
        return msg;
    } catch (e) {
        Logger.log.error('Error in fetch Conversation.', e.message || e);
        if (e.message && e.message.includes('Request failed with status code 500')) {
            Logger.log.error('Returned 500');
            return [];
        }
        return Promise.reject({ message: 'Error in fetch Conversation.' });
    }
};

//*Fetches single LinkedIn Chat*/
const processSalesNavigatorConversation = async (
    response,
    opportunityPublicIdentifier,
    clientId,
    isCreatedAtReceived,
    salesNavigatorObj,
) => {
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
        if (!isCreatedAtReceived) {
            for (let i = 0; i < response.included.length; i++) {
                if (response.included[i].hasOwnProperty('flagshipProfileUrl')) {
                    if (!response.included[i].flagshipProfileUrl.includes(opportunityPublicIdentifier)) {
                        obj['1'] = {
                            entityUrn: response.included[i].entityUrn,
                            profilePicUrl: client.hasOwnProperty('profilePicUrl') ? client.profilePicUrl : null,
                        };
                    } else {
                        obj['2'] = {
                            entityUrn: response.included[i].entityUrn,
                            profilePicUrl: opportunity.hasOwnProperty('profilePicUrl')
                                ? opportunity.profilePicUrl
                                : null,
                        };
                    }
                }
            }
            for (let i = 0; i < response.data.messages.length; i++) {
                let messageObj = {};
                if (response.data.messages[i].hasOwnProperty('author')) {
                    for (let key in obj) {
                        if (obj[key].entityUrn === response.data.messages[i]['author']) {
                            messageObj.id = key;
                            messageObj.profilePicUrl = obj[key].profilePicUrl;
                            messageObj.message = response.data.messages[i]['body'];
                            messageObj.createdAt = response.data.messages[i]['deliveredAt'];
                            msgArr.push(messageObj);
                        }
                    }
                }
            }
        } else {
            obj = salesNavigatorObj;
            // console.log('message arr::', JSON.stringify(response.data.elements, null, 3));
            for (let i = 0; i < response.data.elements.length; i++) {
                let messageObj = {};
                if (response.data.elements[i].hasOwnProperty('author')) {
                    for (let key in obj) {
                        if (obj[key].entityUrn === response.data.elements[i]['author']) {
                            messageObj.id = key;
                            messageObj.profilePicUrl = obj[key].profilePicUrl;
                            messageObj.message = response.data.elements[i]['body'];
                            messageObj.createdAt = response.data.elements[i]['deliveredAt'];
                            msgArr.push(messageObj);
                        }
                    }
                }
            }
        }

        msgArr.sort(function(a, b) {
            return a.createdAt - b.createdAt;
        });

        return { conversationData: msgArr, salesNavigatorObj: obj };
    } catch (e) {
        Logger.log.error('Error in process Conversation.', e.message || e);
        return Promise.reject({ message: 'Error in process Conversation.' });
    }
};

// getSalesNavigatorChatId({
//     cookie: 'li_sugr=b5d25f14-f299-432d-a9dc-12bc75e2f650; bcookie="v=2&62d3b2da-54a8-41fe-8aca-0eae25ec704a"; lissc=1; bscookie="v=1&20201109053758eafa91c9-c036-4df6-808e-b48b310dbf4aAQEXuCAD4AoqQvHmvR6-ukTMOKIEgM-g"; _ga=GA1.2.1719875144.1605090132; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; at_check=true; s_cc=true; SID=c65b30d4-b516-4e03-91cc-e12f391fdaef; VID=V_2020_11_21_12_251; PLAY_LANG=en; aam_uuid=60977001003249996052306952564936584676; spectroscopyId=2873a701-154f-416c-b16f-ba6f5d37897c; visit=v=1&M; s_fid=5FED2C260788DC45-2D997D727F3943A5; G_ENABLED_IDPS=google; mbox=PC#c2542d0f69564aaeb4d600599ba5aef6.31_0#1623160527|session#2f83174740d84bb2ae80129c64f0c64f#1607610387; li_rm=AQH2omrtwxIXWAAAAXZQKuKGjZauPxt2vyuJjWioNvAXnBMfOYTtnePPRs4IP0nwfEF1IhDVBaCrmzBl5kWwDCBIAaPO4vPAb17LLqUtW8lt4hlCTM-vJf4Cv-b940iAelo-PMysNxEE_XIYNKS3cqa4-LHkMyH_ur4RNQuwUwAypp_4hHyRRdEtGMDTt9BcqUhKmfi0IHGNqh-84vSO94kEzVJqX1BG6NzdHUYvMtAfVX5AiNqG8osmrUquFb4_CF3JstGOw_BPvUeLB93MLaSv2EzJqkKMuO20y2r2bSaHdzTISZBGev7SqR_CqMTWFgp6R64Yrdfcig; timezone=Asia/Calcutta; _guid=64f89cfa-cd6b-4b31-90e1-f75ada8ba655; g_state={"i_p":1618918932125,"i_l":3}; sdsc=22%3A1%2C1617701699058%7ECONN%2C0gAHrdkx%2BVQkblfKi6ymZmoIUfwY%3D; s_sq=%5B%5BB%5D%5D; _gcl_au=1.1.1886987163.1618471113; fid=AQGAtBRP2OIjwQAAAXkTohjVDGK1H7xvKdD54lnf9gb5Xr74EYVJHXSt2h8WNoJPNQZ7Gbbek-daEA; fcookie=AQFfJnFx_0y8nwAAAXkd94qEUD46VX_5sm2H92tkdtON-tpuOyduwIlSM8iTaM5e3g-ExIMLmJuIBg0FLVJPSYcHqxphtPLKqkq_S6WRVY26xJQODrfPL8llx-Xp297iiV8IMuF3f01AaOaqIB50dRgi61A_00mgX9gUqm9X6C7rIacCEqLMQjL34aXAsXh2sWJ1Zv00JqDbRe4z2DzL705XPyF1E4Vdds1o-Vu1HGniMhkqDY4yiTirnrlEfG1Sdlq3SeZgvxxRs3sEVK74kPzuzfvzNg8ZIjooum9v6qhrIbDhE1cY0+pUPwB3yEP1oVxGBx6D6tCsXbvmWeEJPQ==; _gid=GA1.2.1880267323.1620026275; AnalyticsSyncHistory=AQLMkDfYQTV6OwAAAXkxFzpNU6_vabN6SyDWc8309ndTLpHu7SNCcgrBBKy3Pbl8LxbzHh3F9zsjhmGDbEZQlQ; lms_ads=AQFdzcByRHlGjAAAAXkxFz0qnuBN7mqm2Y0n1jjA_lfBlTa-zzIBCmcShJAMqYoNDOAu68UFOYJeUkGtwb6qyrK-F3HmvrYQ; lms_analytics=AQFdzcByRHlGjAAAAXkxFz0qnuBN7mqm2Y0n1jjA_lfBlTa-zzIBCmcShJAMqYoNDOAu68UFOYJeUkGtwb6qyrK-F3HmvrYQ; gpv_pn=www.linkedin.com%2Flegal%2Fprivacy-policy; s_plt=2.64; s_pltp=www.linkedin.com%2Flegal%2Fprivacy-policy; s_tp=17838; s_tslv=1620115752445; s_ips=950; s_ppv=www.linkedin.com%2Flegal%2Fprivacy-policy%2C23%2C5%2C4076%2C4%2C18; lang=v=2&lang=en-us; li_at=AQEDATS-shgBf_QMAAABeTa6uDYAAAF5Wsc8Nk4AlVWO2cTYD3Xa3pTyv12MVF0r_jW2MGGKpjCTnoG7mh8QKVm6nHu-R2wiu9qGhRWCtpOVaTFMZZrJRdVicFO3XBWpla-RkX4VxBvVl660ZRTuln2i; liap=true; JSESSIONID="ajax:8721252854603641923"; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C18751%7CMCMID%7C60754425679896049902363508125669678639%7CMCAAMLH-1620725681%7C12%7CMCAAMB-1620725681%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1620128081s%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C-2026318286; li_a=AQJ2PTEmc2FsZXNfY2lkPTg4NjI0NjAwNyUzQSUzQTI1ODI4NTAwN6g2MGYi8st3-j-O9qQfpka_0XHi; PLAY_SESSION=eyJhbGciOiJIUzI1NiJ9.eyJkYXRhIjp7InNlc3Npb25faWQiOiJmYWQwMTQ1ZS1kNjQ4LTRiMDctOWNiNi0wMWJiMjUzYTBiN2Z8MTYxNzcwNjUyNyIsInJlY2VudGx5LXNlYXJjaGVkIjoiIiwicmVmZXJyYWwtdXJsIjoiaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS8iLCJhaWQiOiIiLCJSTlQtaWQiOiJ8MCIsInJlY2VudGx5LXZpZXdlZCI6IjI4MzZ8NzEwfDEwMDgyNnwxMTIxODh8MTA0MDAzIiwiQ1BULWlkIjoiecKGXHUwMDA2wqfCr2pDbMKuPH_CtVx1MDAwMVx1MDAwMGswIiwiZmxvd1RyYWNraW5nSWQiOiJETi9McWpLK1RTR1l5RlJ5Q0VQQjRBPT0iLCJleHBlcmllbmNlIjoiZW50aXR5IiwiaXNfbmF0aXZlIjoiZmFsc2UiLCJ3aGl0ZWxpc3QiOiJ7fSIsInRyayI6IiJ9LCJuYmYiOjE2MjAxMjE1MTIsImlhdCI6MTYyMDEyMTUxMn0.s298VrYcZPDpc_1qByb6oZpW4EDtNuvzDCdAe7U2KdE; UserMatchHistory=AQKSVIrH_4QCmQAAAXk2xJWowjqV7SWQvK824d6RSbK9sxVBWdUZLzFVnXkQIIaD-x-5f5bg2ZKg4YeiX0dUi4Ia_RCbGrUCV4sBwMR_ZIuc9LyxPy9jr7VhKEK-K_dzPNcMUh8c7ouOwTZc83ggzusx5yfr1ETxatS4RITe9OVzK5lpWa1D4E0QeV1dgfakyMvjHlRDfUlWkM4a8BUPw9WFWMEjlaQhNjvYX7A1V8r-pPK212uslZjpVdljC3wK30aWRoxzs_890JAJCqnZaQMEibiaHWuQ50aWrSMTrzyiypfQTAIDkEZevKvDnDMWgA; lidc="b=TB64:s=T:r=T:a=T:p=T:g=2797:u=5:i=1620121525:t=1620191668:v=2:sig=AQHZIAjuz4r8KSgdHn3XwwCScfygQFfM"',
//     ajaxToken: 'ajax:8721252854603641923',
//     publicIdentifier: 'parth-mansatta-b12a761bb'
// })

let updateConversationList = async () => {
    cron.schedule(
        '00 02 * * *', //For 2 AM
        async () => {
            try {
                Logger.log.info('Executing the cron for syncing LinkedIn chats at', new Date());
                let clients = await Client.find({
                    isDeleted: false,
                    isSubscriptionCancelled: false,
                    isCookieExpired: false,
                    _id: '607695299c9b0940bf1c309d',
                });
                for (let i = 0; i < clients.length; i++) {
                    try {
                        let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(clients[i].cookie);
                        let conversation = await Conversation.findOne({ clientId: clients[i]._id });
                        if (!conversation) {
                            conversation = new Conversation({
                                clientId: clients[i]._id,
                                conversations: [],
                            });
                        }
                        let linkedInConversations;
                        if (conversation.linkedInSyncedAt) {
                            linkedInConversations = await extractChats({
                                cookie: cookieStr,
                                ajaxToken: ajaxToken,
                                checkUntil: conversation.linkedInSyncedAt.getTime(),
                                isForCron: true,
                            });
                        } else {
                            linkedInConversations = await extractChats({ cookie: cookieStr, ajaxToken: ajaxToken });
                        }
                        for (let j = 0; j < linkedInConversations.length; j++) {
                            const dbIndex = conversation.conversations
                                .map((c) => c.publicIdentifier)
                                .indexOf(linkedInConversations[j].publicIdentifier);
                            if (dbIndex !== -1) {
                                conversation.conversations[dbIndex].conversationId =
                                    linkedInConversations[j].conversationId;
                            } else {
                                conversation.conversations.push({
                                    conversationId: linkedInConversations[j].conversationId,
                                    publicIdentifier: linkedInConversations[j].publicIdentifier,
                                });
                            }
                        }
                        conversation.linkedInSyncedAt = new Date();
                        await conversation.save();
                    } catch (e) {
                        Logger.log.warn(
                            'Error in syncing chats for the client:',
                            clients[i]._id,
                            clients[i].publicIdentifier,
                        );
                    }
                }
                Logger.log.info('Successfully executed the cron for syncing LinkedIn chats at', new Date());
            } catch (e) {
                Logger.log.warn('Error in CRON to sync chat list', e.message || e);
            }
        },
        {
            scheduled: true,

            timezone: 'Australia/Melbourne',
        },
    ).start();
    Logger.log.info('Successfully set up the CRON to sync chat list');
};

module.exports = {
    extractChats: extractChats,
    fetchConversation,
    getSalesNavigatorChatId,
    fetchSalesNavigatorConversation,
    updateConversationList,
};
