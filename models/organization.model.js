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
        errorMessages: [{ title: Schema.Types.String, text: Schema.Types.String }],
        industries: Schema.Types.Array,
        gender: Schema.Types.Array,
        //  integrations: { strip: { publishableKey: Schema.Types.String, secretKey: Schema.Types.String }, zendesk: {} },
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('organization', organizationSchema);
