const admin = require('firebase-admin');
const Logger = require('./../services/logger');
const serviceAccount = require('../keys/firebase-key');
const mongoose = require('mongoose');
const Client = mongoose.model('client');
/**
 * Config
 * */
const config = require('../config');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.firebase.dbUrl,
});

/**
 * Function sends json data in form of notification, which can be received by frontend
 * */
const sendNotification = ({ tokens, data }) => {
    return new Promise(async (resolve, reject) => {
        try {
            for (let i = 0; i < tokens.length; i++) {
                const payload = {
                    token: tokens[i],
                    data: {
                        payload: JSON.stringify(data),
                    },
                    webpush: {
                        headers: {
                            TTL: '20',
                        },
                    },
                };
                try {
                    let results = await admin.messaging().send(payload);
                    Logger.log.debug(results);
                } catch (e) {
                    if (
                        e.errorInfo &&
                        e.errorInfo.message &&
                        (e.errorInfo.message === 'Requested entity was not found.' ||
                            e.errorInfo.message === 'SenderId mismatch')
                    ) {
                        await Client.updateOne({ fcmToken: tokens[i] }, { $pull: { fcmToken: tokens[i] } });
                        Logger.log.info('Token removed successfully with value:', tokens[i]);
                    }
                }
            }
            Logger.log.debug('NOTIFICATIONS - Sent successfully');
            resolve();
        } catch (err) {
            Logger.log.error('ERROR : ', err);
            reject(err);
        }
    });
};

module.exports = {
    sendNotification: sendNotification,
};
