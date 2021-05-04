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
const conversationSchema = new Schema(
    {
        clientId: mongoose.Schema.Types.ObjectId,
        conversations: [
            {
                conversationId: Schema.Types.String,
                publicIdentifier: Schema.Types.String,
                salesNavigatorId: Schema.Types.String,
            },
        ],
        isDeleted: { type: Schema.Types.Boolean, default: false },
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('conversation', conversationSchema);
