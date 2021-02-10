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
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'client' },
        lastSyncedAt: mongoose.Schema.Types.Date,
        invitees: [
            {
                publicIdentifier: Schema.Types.String,
                sentAt: Schema.Types.Date,
                isAccepted: { type: Schema.Types.Boolean, default: false },
                acceptedAt: Schema.Types.Date,
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
