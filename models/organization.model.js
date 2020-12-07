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
        // subscriptionPrice: {
        //     monthly: 19.0,
        //     yearly: 160.0,
        // },
        organizationId: Schema.Types.String,
        errorMessages: [{ title: Schema.Types.String, text: Schema.Types.String }],
        industries: {
            type: Schema.Types.String,
            enum: [
                'Automotive',
                'Civil Engineering',
                'Computer Software',
                'Financial Services',
                'Architecture & Planing',
                'Government Administration',
                'Hospitality',
                'Human Resources',
                'Information Technology & Services',
                'Marketing & Advertising',
            ],
        },
        gender: { type: Schema.Types.String, enum: ['MALE', 'FEMALE', 'OTHER'] },
        integrations: { strip: { publishableKey: Schema.Types.String, secretKey: Schema.Types.String }, zendesk: {} },
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('organization', organizationSchema);
