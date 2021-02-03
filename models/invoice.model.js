/**
 * Model Definition File
 */

/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

/**
 * Schema Definition
 */
const invoiceSchema = new Schema(
    {
        stripeInvoiceId: { type: Schema.Types.String },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'payment',
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'client',
        },
        amountPaid: Schema.Types.Number,
        amountDue: Schema.Types.Number,
        amountRemaining: Schema.Types.Number,
        totalAmount: Schema.Types.Number,
        currentStatus: Schema.Types.String,
        receiptNumber: Schema.Types.String,
        hostUrl: Schema.Types.String,
        downloadUrl: Schema.Types.String,
        stripeNotification: [
            {
                status: Schema.Types.String,
                eventType: Schema.Types.String,
                receivedAt: Schema.Types.Date,
            },
        ],

        isDeleted: { type: Schema.Types.Boolean, default: false },
    },
    { timestamps: true },
);
invoiceSchema.plugin(mongoosePaginate);

/**
 * Export Schema
 */
module.exports = mongoose.model('invoice', invoiceSchema);
