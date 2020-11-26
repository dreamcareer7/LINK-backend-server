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
const quoteSchema = new Schema(
    {
        quote: Schema.Types.String,
        quoteBy: Schema.Types.String,
        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'tag',
            },
        ],
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('quote', quoteSchema);
