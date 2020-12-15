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
const opportunitySchema = new Schema(
    {
        firstName: Schema.Types.String,
        lastName: Schema.Types.String,
        title: Schema.Types.String,
        companyName: Schema.Types.String,
        linkedInUrl: Schema.Types.String,
        email: Schema.Types.String,
        profilePicUrl: Schema.Types.String,
        publicIdentifier: Schema.Types.String,

        stage: {
            type: Schema.Types.String,
            enum: ['INITIAL_CONTACT', 'IN_CONVERSION', 'MEETING_BOOKED', 'FOLLOW_UP', 'CLOSED', 'LOST'],
        },
        dealSize: Schema.Types.Number,
        potential: { type: Schema.Types.String, enum: ['LIKELY', 'VERY_LIKELY', 'NOT_LIKELY'] },
        followUp: Schema.Types.Date,
        notes: [{ text: Schema.Types.String, creationTime: Schema.Types.Date, updationTime: Schema.Types.Date }],
    },
    { timestamps: true },
);

/**
 * Export Schema
 */
module.exports = mongoose.model('opportunity', opportunitySchema);
