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
const notificationSchema = new Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'client',
        },
        opportunityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'opportunity',
        },
        isRead: { type: Schema.Types.Boolean, default: false },
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('notification', notificationSchema);
