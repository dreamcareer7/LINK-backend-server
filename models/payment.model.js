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
const paymentSchema = new Schema(
    {
        stripeSubscriptionId: { type: Schema.Types.String },
        stripePlanId: { type: Schema.Types.String },
        paymentAmount: { type: Schema.Types.Number },
        planType: { type: Schema.Types.String, enum: ['FREE_TRIAL', 'MONTHLY', 'YEARLY'] },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'client',
        },
        stripeNotification: [
            {
                subscriptionStatus: Schema.Types.String,
                subscriptionInterval: Schema.Types.String,
                receivedAt: Schema.Types.Date,
            },
        ],
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('payment', paymentSchema);
