const Logger = require('../services/logger');
const axios = require('axios');
const { raw } = require('express');

const extract_chats = async (cookie, ajaxToken) => {
    try {
        let created_before = null;
        let extracted_chats = [];
        while (true) {
            let raw_chats_data = await fetch_chats(cookie, ajaxToken, created_before);
            console.log('---', raw_chats_data);
            let processed_chat_data = await process_chat_data(raw_chats_data);
            if (processed_chat_data['chats']) {
                extracted_chats.push(processed_chat_data['chats']);
                created_before = processed_chat_data['lowestLastActivity'];
            } else {
                break;
            }
        }
        return extracted_chats;
    } catch (e) {
        Logger.log.error('Error in extract_chats.', e.message || e);
        return Promise.reject({ message: 'Error in extract_chats.' });
    }
};

const process_chat_data = async (raw_chats_data) => {
    try {
        let extracted_chats = [];
        let raw_chats = {};
        let last_activities = {};
        let entity_urns = {};
        let lowest_last_activity = 0;
        let raw_data = raw_chats_data['included'];

        for (let item in raw_data) {
            let item_type = item['$type'];
            if (item_type == 'com.linkedin.voyager.identity.shared.MiniProfile') {
                raw_chats[item['entityUrn']] = {
                    firstName: item['firstName'],
                    lastName: item['lastName'],
                    occupation: item['occupation'],
                    publicIdentifier: item['publicIdentifier'],
                    entityUrn: item['entityUrn'],
                    trackingId: item['trackingId'],
                    $type: item['$type'],
                };
            } else if (item_type == 'com.linkedin.voyager.entities.shared.MiniCompany') {
                raw_chats[item['entityUrn']] = {
                    name: item['name'],
                    universalName: item['universalName'],
                    entityUrn: item['entityUrn'],
                    trackingId: item['trackingId'],
                    $type: item['$type'],
                };
            } else if (item_type == 'com.linkedin.voyager.messaging.Conversation') {
                last_activities[item['*participants'][0]] = {
                    lastActivityAt: item['lastActivityAt'],
                };
                if (lowest_last_activity == 0 || lowest_last_activity > item['lastActivityAt']) {
                    lowest_last_activity = item['lastActivityAt'];
                }
            } else if (item_type == 'com.linkedin.voyager.messaging.MessagingMember') {
                conversation_id = item['entityUrn'].split('fs_messagingMember:(')[1].split(',')[0];
                entity_urns[item['*miniProfile']] = {
                    entityUrn: item['entityUrn'],
                    conversationId: conversation_id,
                };
            } else if (item_type == 'com.linkedin.voyager.messaging.MessagingCompany') {
                conversation_id = item['entityUrn'].split('fs_messagingCompany:(')[1].split(',')[0];
                entity_urns[item['*miniCompany']] = {
                    entityUrn: item['entityUrn'],
                    conversationId: conversation_id,
                };
            }
        }

        for (let chat_id in raw_chats) {
        }
        return {
            chats: extracted_chats,
            lowestLastActivity: lowest_last_activity,
        };
    } catch (e) {
        Logger.log.error('Error in process_chat_data.', e.message || e);
        return Promise.reject({ message: 'Error in process_chat_data.' });
    }
};
const fetch_chats = async (cookie, ajaxToken, created_before) => {
    try {
        if (created_before == null) {
            url =
                'https://www.linkedin.com/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX&count=20&q=syncToken';
        } else {
            url = `https://www.linkedin.com/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX&createdBefore=${created_before}`;
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
        console.log(response);
        return response;
    } catch (e) {
        Logger.log.error('Error in fetch chat.', e.message || e);
        return Promise.reject({ message: 'Error in fetch chat.' });
    }
};

module.exports = {
    extract_chats,
};
