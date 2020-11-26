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
        subscriptionPrice: {
            monthly: 19.0,
            yearly: 160.0,
        },
        errorMessages: [{ title: '', text: '' }],
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
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('organization', organizationSchema);
