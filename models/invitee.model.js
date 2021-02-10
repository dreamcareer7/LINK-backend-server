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
const inviteeSchema = new Schema(
    {
        clientId: mongoose.Schema.Types.ObjectId,
        lastSyncedAt: mongoose.Schema.Types.Date,
        invitees: [
            {
                sentAt: Schema.Types.Date,
                isAccepted: { type: Schema.Types.Boolean, default: false },
                publicIdentifier: Schema.Types.String,
            },
        ],
        isDeleted: { type: Schema.Types.Boolean, default: false },
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('invitee', inviteeSchema);
