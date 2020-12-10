/**
 * Model Definition File
 */

/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
const config = require('../config');

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
        password: Schema.Types.String,
        profileUrl: Schema.Types.String,
        industry: Schema.Types.String,
        companyName: Schema.Types.String,
        companySize: Schema.Types.String,
        linkedInID: Schema.Types.String,
        companyLocation: Schema.Types.String,
        jwtToken: [
            {
                expiredTime: Schema.Types.Number,
                token: Schema.Types.String,
            },
        ],
        notificationType: {
            email: { type: Schema.Types.Boolean, default: false },
            browser: { type: Schema.Types.Boolean, default: false },
        },
        notificationPeriod: {
            interval: { type: Schema.Types.String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] },
            customDate: { type: Schema.Types.Date, default: null },
        },
        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'tag',
            },
        ],
        isDeleted: { type: Schema.Types.Boolean, default: false },
        isSubscriptionPaused: { type: Schema.Types.Boolean, default: true },
        isSubscriptionCancelled: { type: Schema.Types.Boolean, default: false },
        isSubscribed: { type: Schema.Types.Boolean, default: false },
        isFreeTrialUsed: { type: Schema.Types.Boolean, default: false },
        selectedPlan: {
            currentPlan: { type: Schema.Types.String, enum: ['FREE_TRIAL', 'MONTHLY', 'YEARLY'] },
            planStartDate: Schema.Types.Date,
            planEndDate: Schema.Types.Date,
        },
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
    let jwtSecret = config.jwtSecret;
    let d = new Date();
    let flag = false;
    let counter;
    let clientData;

    try {
        decoded = jwt.verify(token, jwtSecret);
        clientData = await client.findOne({
            _id: decoded._id,
        });
        for (let i = 0; i < clientData.jwtToken.length; i++) {
            if (clientData.jwtToken[i].token === token) {
                flag = true;
                counter = i;
                break;
            }
        }

        if (flag) {
            if (clientData.jwtToken[counter].expiredTime > d.getTime()) {
                decoded = jwt.verify(token, jwtSecret);
                return clientData;
            } else {
                clientData.jwtToken.splice(counter, 1);
                await clientData.save();
                return Promise.reject({ status: 'TOKEN_EXPIRED', message: 'JwtToken is expired' });
            }
        } else {
            return Promise.reject({ status: 'TOKEN_NOT_FOUND', message: 'JwtToken is not found' });
        }
    } catch (e) {
        return Promise.reject({ status: 'INVALID_TOKEN', message: 'Cannot decode token' });
    }
};

/**
 * Generates token at the time of Login call
 */
clientSchema.methods.getAuthToken = function() {
    let c = this;
    let jwtSecret = config.jwtSecret;
    let access = 'auth';
    let token = jwt.sign({ _id: c._id.toHexString(), access }, jwtSecret).toString();
    return token;
};

/**
 * Export Schema
 */
module.exports = mongoose.model('client', clientSchema);
