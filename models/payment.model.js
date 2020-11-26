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
        paymentAmount: { type: Schema.Types.Number },
        paymentDate: Schema.Types.Date,
        paymentStatus: {
            type: Schema.Types.String,
            enum: ['PAID', 'PAYMENT_REQUESTED', 'PENDING'],
            default: 'PENDING',
        },
        plan: { type: Schema.Types.String, enum: ['FREE_TRIAL', 'MONTHLY', 'YEARLY'] },
        planStartDate: Schema.Types.Date,
        planEndDate: Schema.Types.Date,
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('payment', paymentSchema);
