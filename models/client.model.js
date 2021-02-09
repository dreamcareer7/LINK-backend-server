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
        invitedToken: { type: Schema.Types.String, default: null },
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
        stripeCustomerId: { type: Schema.Types.String },
        selectedPlan: {
            planSelected: { type: Schema.Types.String, enum: ['MONTHLY', 'YEARLY'] },
            status: { type: Schema.Types.String, enum: ['FREE_TRIAL', 'MONTHLY', 'YEARLY', 'PAUSED', 'CANCELLED'] },
            trialEndDate: Schema.Types.Date,
            startDate: Schema.Types.Date,
        },
        totalReceivedAmount: { type: Schema.Types.Number, default: 0 },
        cookie: Schema.Types.String,
        isCookieExpired: { type: Schema.Types.Boolean },
        isExtensionInstalled: { type: Schema.Types.Boolean, default: false },

        //  ajaxToken: Schema.Types.String,
        fcmToken: [Schema.Types.String],
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
        });
        //Note: Commented the checking of token to be present in the Database, because the User can be redirected to dashboard from the email as well
        //      So it is not advisable to add a token Daily while sending the mail

        // if (clientData.jwtToken.indexOf(token) !== -1) {
        if (decoded.expiredTime > d.getTime()) {
            return clientData;
        } else {
            // clientData.jwtToken.splice(clientData.jwtToken.indexOf(token), 1);
            // await clientData.save();
            return Promise.reject({ status: 'TOKEN_EXPIRED', message: 'JwtToken is expired' });
        }
        // } else {
        //     return Promise.reject({ status: 'TOKEN_NOT_FOUND', message: 'JwtToken is not found' });
        // }
    } catch (e) {
        return Promise.reject({ status: 'INVALID_TOKEN', message: 'Cannot decode token' });
    }
};

/**
 * Generates token at the time of Login call
 */
clientSchema.methods.getAuthToken = function() {
    let c = this;
    let d = new Date();
    let jwtSecret = config.jwt.secret;
    let access = 'auth';
    let token = jwt
        .sign(
            {
                _id: c._id.toHexString(),
                expiredTime: parseFloat(config.jwt.clientExpireTimeInHours) * 3600 * 1000 + d.getTime(),
                access,
            },
            jwtSecret,
        )
        .toString();
    return token;
};
clientSchema.plugin(mongoosePaginate);

/**
 * Export Schema
 */
module.exports = mongoose.model('client', clientSchema);
