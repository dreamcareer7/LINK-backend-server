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
        conversationId: mongoose.Schema.Types.ObjectId,
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('conversation', conversationSchema);
