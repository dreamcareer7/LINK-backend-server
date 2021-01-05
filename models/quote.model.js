/**
 * Model Definition File
 */

/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

/**
 * Schema Definition
 */
const quoteSchema = new Schema(
    {
        quote: Schema.Types.String,
        quoteBy: Schema.Types.String,
        isPublished: { type: Schema.Types.Boolean, default: false },
        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'tag',
            },
        ],
    },
    { timestamps: true },
);
quoteSchema.plugin(mongoosePaginate);

/**
 * Export Schema
 */
module.exports = mongoose.model('quote', quoteSchema);
