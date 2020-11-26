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
const adminSchema = new Schema(
    {
        firstName: Schema.Types.String,
        lastName: Schema.Types.String,
        email: Schema.Types.String,
        phone: Schema.Types.String,
        password: Schema.Types.String,
        profileUrl: Schema.Types.String,
        isDeleted: { type: Schema.Types.Boolean, default: false },
        integrations: { strip: { publishableKey: Schema.Types.String, secretKey: Schema.Types.String }, zendesk: {} },
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('admin', adminSchema);
