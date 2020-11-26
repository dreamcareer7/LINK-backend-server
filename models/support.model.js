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
const supportSchema = new Schema(
    {
        title: Schema.Types.String,
        description: Schema.Types.String,
        attachment: Schema.Types.String,
        isViewed: { type: Schema.Types.Boolean, default: false },
        isResloved: { type: Schema.Types.Boolean, default: false },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'client',
        },
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('support', supportSchema);
