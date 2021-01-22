const moment = require('moment-timezone');
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Opportunity = mongoose.model('opportunity');
const Notification = mongoose.model('notification');
const FirebaseHelper = require('./firebase-notification');
const Logger = require('./../services/logger');

const scheduleNotification = async () => {
    let dt = await getDateForSpecificTimezone();
    let promiseArr = [];
    let clients = await Client.find({ isDeleted: false }).lean();
    Logger.log.trace('Notification sending for the date:', dt.startDate);
    if (clients.length !== 0) {
        for (let i = 0; i < clients.length; i++) {
            let opportunities = await Opportunity.find({
                clientId: clients[i]._id,
                isDeleted: false,
                followUp: { $gte: dt.startDate, $lte: dt.endDate },
            }).select('_id');
            // Logger.log.info('Opportunities for Client Id', clients[i]._id, opportunities);
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
                        promiseArr.push(notification.save);
                    });
                }
                if (clients[i].notificationType.email) {
                    let opportunityForMail = opportunities.map(
                        ({ firstName, lastName, title, stage, profilePicUrl }) => ({
                            firstName,
                            lastName,
                            title,
                            stage,
                            profilePicUrl,
                        }),
                    );
                    let mailObj = {
                        text: {
                            firstName: clients[i].firstName,
                            lastName: clients[i].lastName,
                        },
                    };
                    //TODO SEND MAIL FUNCTION
                    // promiseArr.push(FirebaseHelper.sendNotification({tokens: clients[i].fcmToken, data: opportunity}));
                }
            }
        }
    }
    await Promise.all(promiseArr);
    Logger.log.trace('Notifications sent successfully.');
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

module.exports = {
    scheduleNotification: scheduleNotification,
};
