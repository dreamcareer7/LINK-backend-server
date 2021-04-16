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
const strategySchema = new Schema(
    {
        sequenceNumber: { type: Schema.Types.Number },
        title: { type: Schema.Types.String },
        description: { type: Schema.Types.String },
        videoScript: { type: Schema.Types.String },
        isDeleted: { type: Schema.Types.Boolean, default: false },
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('strategy', strategySchema);
