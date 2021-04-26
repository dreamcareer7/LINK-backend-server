/**
 * Model Definition File
 */

/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
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
        phone: Schema.Types.String,
        profilePicUrl: Schema.Types.String,
        publicIdentifier: Schema.Types.String,
        isDeleted: { type: Schema.Types.Boolean, default: false },
        clientId: mongoose.Schema.Types.ObjectId,
        location: Schema.Types.String,
        stage: {
            type: Schema.Types.String,
            enum: ['INITIAL_CONTACT', 'IN_CONVERSION', 'MEETING_BOOKED', 'FOLLOW_UP', 'CLOSED', 'LOST', 'POTENTIAL'],
            // default: 'INITIAL_CONTACT',
        },
        stageLogs: [
            {
                value: Schema.Types.String,
                changedAt: Schema.Types.Date,
            },
        ],
        dealSize: Schema.Types.Number,
        likelyHood: { type: Schema.Types.String, enum: ['LIKELY', 'VERY_LIKELY', 'NOT_LIKELY'] },
        followUp: Schema.Types.Date,
        notes: [{ text: Schema.Types.String, creationTime: Schema.Types.Date, updationTime: Schema.Types.Date }],
        isVisited: { type: Schema.Types.Boolean, default: false },
        isSaved: { type: Schema.Types.Boolean, default: false },
    },
    { timestamps: true },
);
opportunitySchema.plugin(mongoosePaginate);
/**
 * Export Schema
 */
module.exports = mongoose.model('opportunity', opportunitySchema);
