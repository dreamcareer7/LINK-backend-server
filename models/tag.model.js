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
const tagSchema = new Schema(
    {
        tag: Schema.Types.String,
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('tag', tagSchema);
