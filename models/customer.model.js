/**
 * Model Definition File
 */

/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema Definition
 */

const customerSchema = new Schema({
    name: Schema.Types.String,
    email: Schema.Types.String,
    phone: Schema.Types.String,
    title: Schema.Types.String,
    password: Schema.Types.String,
    profileUrl: Schema.Types.String,
    industry: Schema.Types.String,
    companyName: Schema.Types.String,
    companySize: Schema.Types.String,
    companyLocation: Schema.Types.String,
    notificationType: {
        email: { type: Schema.Types.Boolean, default: false },
        browser: { type: Schema.Types.Boolean, default: false },
    },
    notificationPeriod: {
        interval: { type: Schema.Types.String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] },
        customDate: { type: Schema.Types.Date, default: null },
    },
    isDeleted: { type: Schema.Types.Boolean, default: false },
    isSubscriptionPushed: { type: Schema.Types.Boolean, default: true },
    isSubscribed: { type: Schema.Types.Boolean, default: false },
    paymentRecord: [
        {
            paymentAmount: { type: Schema.Types.Number },
            paymentDate: Schema.Types.Date,
            paymentStatus: {
                type: Schema.Types.String,
                enum: ['PAID', 'PAYMENT_REQUESTED', 'PENDING'],
                default: 'PENDING',
            },
        },
    ],
    selectedPlan: {
        currentPlan: { type: Schema.Types.String, enum: ['FREE_TRIAL', 'MONTHLY', 'YEARLY'] },
        planStartDate: Schema.Types.Date,
        planEndDate: Schema.Types.Date,
    },
});

/**
 * Export Schema
 */
module.exports = mongoose.model('customer', customerSchema);
