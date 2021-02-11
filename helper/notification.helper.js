const moment = require('moment-timezone');
const cron = require('node-cron');
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Opportunity = mongoose.model('opportunity');
const Notification = mongoose.model('notification');
const FirebaseHelper = require('./firebase-notification');
const mailHelper = require('./mailer.helper');
const config = require('../config');
const Logger = require('./../services/logger');

const scheduleNotification = async () => {
    // Setted Statically at 06:00 AM Australian Time
    cron.schedule(
        // '55 27 19 * * *',
        '00 06 * * *', //For 6 AM
        async () => {
            let dt = await getDateForSpecificTimezone();
            Logger.log.info('Executing the cron for follow ups for the date:', dt.startDate);
            let promiseArr = [];
            let clients = await Client.find({ isDeleted: false }).select(
                '_id firstName lastName email notificationType fcmToken',
            );
            if (clients.length !== 0) {
                for (let i = 0; i < clients.length; i++) {
                    let opportunities = await Opportunity.find({
                        clientId: clients[i]._id,
                        isDeleted: false,
                        followUp: { $gte: dt.startDate, $lte: dt.endDate },
                    }).select('_id firstName lastName title stage profilePicUrl');
                    if (opportunities.length !== 0) {
                        if (clients[i].notificationType.browser) {
                            promiseArr.push(
                                FirebaseHelper.sendNotification({ tokens: clients[i].fcmToken, data: opportunities }),
                            );
                            opportunities.forEach((opportunity) => {
                                let notification = new Notification({
                                    clientId: clients[i]._id,
                                    opportunityId: opportunity._id,
                                });
                                promiseArr.push(notification.save());
                            });
                        }
                        if (clients[i].notificationType.email && clients[i].email) {
                            let opportunityForMail = opportunities.map(
                                ({ firstName, lastName, title, stage, profilePicUrl }) => ({
                                    firstName,
                                    lastName,
                                    title,
                                    stageStr: getStageStr(stage),
                                    profilePicUrl,
                                }),
                            );
                            let token = clients[i].getAuthToken();
                            let mailObj = {
                                toAddress: [clients[i].email],
                                subject: 'Here are your daily follow-ups to action inside of Jayla',
                                text: {
                                    firstName: clients[i].firstName,
                                    lastName: clients[i].lastName,
                                    opportunities: opportunityForMail,
                                    dashboardUrl: `${config.clientUrls.clientFrontEndBaseUrl}auth-verify?token=${token}`,
                                },
                                mailFor: 'client-follow-ups',
                            };
                            mailHelper.sendMail(mailObj);
                        }
                    }
                }
            }
            await Promise.all(promiseArr);
            Logger.log.trace('Notifications sent successfully.');
        },
        {
            scheduled: true,

            timezone: 'Australia/Melbourne',
        },
    ).start();
    Logger.log.info('Successfully set up the cron for follow ups');
};

const getDateForSpecificTimezone = async () => {
    const currentTime = new Date();
    const now = moment.utc(currentTime);
    const timezoneOffset = moment.tz.zone('Australia/Melbourne').utcOffset(now);
    const serverOffset = currentTime.getTimezoneOffset();
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setTime(today.getTime() + (timezoneOffset - serverOffset) * 60 * 1000);
    let tomorrow = new Date(today);
    tomorrow.setTime(tomorrow.getTime() + 24 * 3600 * 1000 - 1000);
    console.log('today::', today);
    console.log('tomorrow::', tomorrow);
    return {
        startDate: today,
        endDate: tomorrow,
    };
};

const getStageStr = (stage) => {
    switch (stage) {
        case 'INITIAL_CONTACT':
            return 'Initial Contact';
        case 'IN_CONVERSION':
            return 'In Conversation';
        case 'MEETING_BOOKED':
            return 'Meeting Booked';
        case 'FOLLOW_UP':
            return 'Follow Up';
        case 'CLOSED':
            return 'Deal Closed';
        case 'LOST':
            return 'Deal Lost';
        case 'POTENTIAL':
            return 'Potential';
        default:
            return '';
    }
};

module.exports = {
    scheduleNotification: scheduleNotification,
};
