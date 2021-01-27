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
const organizationSchema = new Schema(
    {
        organizationId: Schema.Types.String,
        errorMessages: [
            {
                title: Schema.Types.String,
                text: Schema.Types.String,
                description: Schema.Types.String,
            },
        ],
        industries: Schema.Types.Array,
        companySize: Schema.Types.Array,
        quote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'quote',
        },
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('organization', organizationSchema);
