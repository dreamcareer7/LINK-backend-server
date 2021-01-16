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
        clientId: mongoose.Schema.Types.ObjectId,
        isReaded: { type: Schema.Types.Boolean, default: false },
        notifications: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'opportunity',
            },
        ],
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('notification', notificationSchema);
