const Logger = require('../services/logger');
const axios = require('axios');
const cron = require('node-cron');
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Client = mongoose.model('client');
const Invitee = mongoose.model('invitee');
const cookieHelper = require('./cookie.helper');
const opportunityHelper = require('../helper/opportunity.helper');
const config = require('../config');

const syncInvitees = async () => {
    try {
        let interval = config.linkedIn.inviteeScrapIntervalInMinutes;
        let cronString = '';
        if (interval % 60 === 0) {
            interval = interval / 60;
            cronString = `0 */${interval} * * *`;
        } else {
            cronString = `*/${interval} * * * *`;
        }
        cron.schedule(
            cronString,
            async () => {
                Logger.log.info('Syncing invitee list at:', new Date());
                let invitees = await Invitee.find({ isDeleted: false }).populate({
                    path: 'clientId',
                    select: {
                        cookie: 1,
                        isCookieExpired: 1,
                        isExtensionInstalled: 1,
                        isSubscriptionCancelled: 1,
                        publicIdentifier: 1,
                    },
                });
                for (let i = 0; i < invitees.length; i++) {
                    // console.log('Processing for Client', invitees[i]._id);
                    // console.log('Processing for Client', invitees[i]);
                    if (
                        invitees[i] &&
                        invitees[i].clientId &&
                        invitees[i].clientId.cookie &&
                        !invitees[i].clientId.isCookieExpired &&
                        !invitees[i].clientId.isSubscriptionCancelled
                    ) {
                        let count = 30;
                        let processedAllAfterLastSync = false;
                        let { cookieStr, ajaxToken } = await cookieHelper.getModifyCookie(invitees[i].clientId.cookie);
                        while (!processedAllAfterLastSync) {
                            let data = {
                                method: 'get',
                                url: `https://www.linkedin.com/voyager/api/relationships/dash/connections?decorationId=com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-5&count=${count}&q=search&sortType=RECENTLY_ADDED`,
                                headers: {
                                    authority: 'www.linkedin.com',
                                    accept: 'application/vnd.linkedin.normalized+json+2.1',
                                    'csrf-token': ajaxToken,
                                    'x-restli-protocol-version': '2.0.0',
                                    'x-li-lang': 'en_US',
                                    'user-agent':
                                        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
                                    'x-li-page-instance':
                                        'urn:li:page:d_flagship3_people_connections;zgGp+gSZRsqBzWhnKAV4JQ==',
                                    'x-li-track':
                                        '{"clientVersion":"1.7.9205","mpVersion":"1.7.9205","osName":"web","timezoneOffset":5.5,"timezone":"Asia/Calcutta","deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":1,"displayWidth":1920,"displayHeight":1080}',
                                    'sec-fetch-site': 'same-origin',
                                    'sec-fetch-mode': 'cors',
                                    'sec-fetch-dest': 'empty',
                                    referer: 'https://www.linkedin.com/mynetwork/',
                                    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                                    cookie: cookieStr,
                                },
                            };
                            try {
                                let response = await axios(data);
                                // TODO process invitees
                                let { moreSyncRequired, newConnections } = processInvitees({
                                    linkedInResponse: response.data,
                                    lastSyncTimeInMs: invitees[i].lastSyncedAt.getTime(),
                                });
                                processedAllAfterLastSync = !moreSyncRequired;
                                for (let j = 0; j < invitees[i].invitees.length; j++) {
                                    if (!invitees[i].invitees[j].isAccepted) {
                                        let newConnectionAsInvitee = newConnections
                                            .filter(
                                                (c) => c.publicIdentifier === invitees[i].invitees[j].publicIdentifier,
                                            )
                                            .pop();
                                        if (newConnectionAsInvitee) {
                                            Logger.log.info(
                                                `Updating "${newConnectionAsInvitee.publicIdentifier}" for "${invitees[i].clientId.publicIdentifier}"`,
                                                newConnectionAsInvitee,
                                            );
                                            invitees[i].invitees[j].isAccepted = true;
                                            invitees[i].invitees[j].acceptedAt = new Date(
                                                newConnectionAsInvitee.acceptedAt,
                                            );
                                            await addOpportunityFromPublicIdentifier({
                                                cookieStr,
                                                ajaxToken,
                                                clientId: invitees[i].clientId._id,
                                                publicIdentifier: newConnectionAsInvitee.publicIdentifier,
                                            });
                                        }
                                    }
                                }
                                await invitees[i].save();
                            } catch (e) {
                                Logger.log.error(
                                    'Error in fetching connection list for client:',
                                    invitees[i].clientId.publicIdentifier,
                                );
                                processedAllAfterLastSync = true;
                                await Client.updateOne({ _id: invitees[i].clientId._id }, { isCookieExpired: true });
                                break;
                            }
                        }
                    }
                }
            },
            {
                scheduled: true,
                timezone: 'Australia/Melbourne',
            },
        ).start();
        Logger.log.info('Successfully set up the cron for Invitee scrapping');
    } catch (e) {
        Logger.log.error('Error in fetch chat.', e.message || e);
        return Promise.reject({ message: 'Error in fetch chat.' });
    }
};

const processInvitees = ({ linkedInResponse, lastSyncTimeInMs }) => {
    try {
        let moreSyncRequired = false;
        let newConnections = [];
        if (
            linkedInResponse &&
            linkedInResponse.data &&
            linkedInResponse.data.elements &&
            linkedInResponse.data.elements.length !== 0
        ) {
            for (let i = 0; i < linkedInResponse.data.elements.length; i++) {
                if (linkedInResponse.data.elements[i].createdAt >= lastSyncTimeInMs) {
                    let profileObj = linkedInResponse.included
                        .filter((p) => p.entityUrn === linkedInResponse.data.elements[i].connectedMember)
                        .pop();
                    if (profileObj) {
                        newConnections.push({
                            publicIdentifier: profileObj.publicIdentifier,
                            acceptedAt: linkedInResponse.data.elements[i].createdAt,
                        });
                    }
                } else {
                    break;
                }
            }
            if (
                linkedInResponse.data.elements[linkedInResponse.data.elements.length - 1].createdAt > lastSyncTimeInMs
            ) {
                moreSyncRequired = true;
            }
        }
        return {
            moreSyncRequired,
            newConnections,
        };
    } catch (e) {
        Logger.log.error('Error in process invitees.', e.message || e);
        return Promise.reject({ message: 'Error in process invitees.' });
    }
};

let addOpportunityFromPublicIdentifier = async ({ cookieStr, ajaxToken, publicIdentifier, clientId }) => {
    try {
        let opportunityData = await opportunityHelper.getProfile(publicIdentifier, cookieStr, ajaxToken);
        let contactInfo = await opportunityHelper.getContactInfo(publicIdentifier, cookieStr, ajaxToken);
        opportunityData = { ...opportunityData, ...contactInfo };
        opportunityData.clientId = clientId;
        let opportunity = await Opportunity.findOne({
            clientId: clientId,
            isDeleted: false,
            publicIdentifier: publicIdentifier,
        });

        if (opportunity) {
            opportunity = await Opportunity.findOneAndUpdate(
                { clientId: clientId, isDeleted: false, publicIdentifier: publicIdentifier },
                opportunityData,
                { new: true },
            );
            Logger.log.info('Opportunity updated.');
        } else {
            opportunity = new Opportunity(opportunityData);
            await opportunity.save();
            Logger.log.info('New Opportunity added.');
        }
        return opportunity;
    } catch (e) {}
};

module.exports = {
    syncInvitees,
};
