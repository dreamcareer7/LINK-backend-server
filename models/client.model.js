/**
 * Model Definition File
 */

/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
const jwt = require('jsonwebtoken');
const config = require('../config');
const Logger = require('../services/logger');

/**
 * Schema Definition
 */

const clientSchema = new Schema(
    {
        firstName: Schema.Types.String,
        lastName: Schema.Types.String,
        email: Schema.Types.String,
        phone: Schema.Types.String,
        title: Schema.Types.String,
        profilePicUrl: Schema.Types.String,
        industry: Schema.Types.String,
        companyName: Schema.Types.String,
        linkedInUrl: Schema.Types.String,
        companySize: {
            type: Schema.Types.String,
        },
        linkedInID: Schema.Types.String,
        publicIdentifier: Schema.Types.String,
        loggedInIdentifier: Schema.Types.String,
        companyLocation: Schema.Types.String,
        gender: { type: Schema.Types.String, enum: ['MALE', 'FEMALE', 'OTHER'] },
        isConversationAdded: { type: Schema.Types.Boolean, default: false },
        vicSub: { type: Schema.Types.Boolean, default: false },
        isInvited: { type: Schema.Types.Boolean, default: false },
        jwtToken: [Schema.Types.String],
        notificationType: {
            email: { type: Schema.Types.Boolean, default: false },
            browser: { type: Schema.Types.Boolean, default: false },
        },
        // notificationPeriod: {
        //     interval: { type: Schema.Types.String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] },
        //     customDate: { type: Schema.Types.Date, default: null },
        // },
        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'tag',
            },
        ],
        isDeleted: { type: Schema.Types.Boolean, default: false },
        isSubscribed: { type: Schema.Types.Boolean, default: false },
        isSubscriptionCancelled: { type: Schema.Types.Boolean, default: false },
        isSubscriptionAppliedForCancellation: { type: Schema.Types.Boolean, default: false },
        stripeCustomerId: { type: Schema.Types.String },
        selectedPlan: {
            planSelected: { type: Schema.Types.String, enum: ['MONTHLY', 'YEARLY'] },
            status: { type: Schema.Types.String, enum: ['FREE_TRIAL', 'MONTHLY', 'YEARLY', 'PAUSED', 'CANCELLED'] },
            trialEndDate: Schema.Types.Date,
            startDate: Schema.Types.Date,
        },
        totalReceivedAmount: { type: Schema.Types.Number, default: 0 },
        cookie: Schema.Types.Mixed,
        // cookieArr: [Schema.Types.Mixed],
        isCookieExpired: { type: Schema.Types.Boolean },
        isSalesCookieExpired: { type: Schema.Types.Boolean, default: false },
        isExtensionInstalled: { type: Schema.Types.Boolean, default: false },

        //  ajaxToken: Schema.Types.String,
        fcmToken: [Schema.Types.String],
        logoutAllDevicesAt: { type: Schema.Types.Date },
        lastSyncForChatsAt: { type: Schema.Types.Date },
        lastRequestAt: { type: Schema.Types.Date, default: new Date() },
        socketIds: [{ type: Schema.Types.String, default: [] }],
        extensionSocketIds: [{ type: Schema.Types.String, default: [] }],
        lastOnLinkedInAt: { type: Schema.Types.Date },
        timeSpentOnLinkedInInMs: { type: Schema.Types.Number, default: 0 },
        hasSalesNavigatorAccount: { type: Schema.Types.Boolean, default: false },
    },
    { timestamps: true },
);

/**
 * Finds Client from token
 * @param token
 */
clientSchema.statics.findByToken = async function(token) {
    let client = this;
    let decoded;
    let jwtSecret = config.jwt.secret;
    let d = new Date();
    let clientData;
    try {
        decoded = jwt.verify(token, jwtSecret);
        clientData = await client.findOne({
            _id: decoded._id,
            isDeleted: false,
        });
        if (
            clientData &&
            (!clientData.logoutAllDevicesAt || clientData.logoutAllDevicesAt.getTime() < decoded.generatedAt)
        ) {
            if (
                clientData.lastRequestAt &&
                clientData.lastRequestAt.getTime() + parseFloat(config.jwt.clientExpireTimeInHours) * 3600 * 1000 >
                    d.getTime()
            ) {
                await client.updateOne(
                    {
                        _id: decoded._id,
                    },
                    { lastRequestAt: new Date() },
                );
                return clientData;
            } else {
                Logger.log.info('More days passed for the last request of the user');
                return Promise.reject({
                    status: 'TOKEN_EXPIRED',
                    message: 'More days passed for the last request of the user',
                });
            }
        } else {
            Logger.log.info('Client not found or token is expired', client._id);
            return Promise.reject({ status: 'TOKEN_EXPIRED', message: 'JwtToken is expired' });
        }
    } catch (e) {
        console.log('Error in finding client by token', e.message || e);
        return Promise.reject({ status: 'INVALID_TOKEN', message: 'Cannot decode token' });
    }
};

/**
 * Generates token at the time of Login call
 */
clientSchema.methods.getAuthToken = async function(updateTime = true) {
    try {
        let c = this;
        let d = new Date();
        let jwtSecret = config.jwt.secret;
        let access = 'auth';
        let token = jwt
            .sign(
                {
                    _id: c._id.toHexString(),
                    generatedAt: d.getTime(),
                    access,
                },
                jwtSecret,
            )
            .toString();
        if (updateTime) {
            c.lastRequestAt = new Date();
            await c.save();
        }
        return token;
    } catch (e) {
        console.log('Error in generating token for client', e.message || e);
        return Promise.reject(e);
    }
};
clientSchema.plugin(mongoosePaginate);

/**
 * Export Schema
 */
module.exports = mongoose.model('client', clientSchema);
