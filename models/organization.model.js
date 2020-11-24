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
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('organization', organizationSchema);
