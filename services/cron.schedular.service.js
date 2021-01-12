const mongoose = require('mongoose');
const Organization = mongoose.model('organization');
const Quote = mongoose.model('quote');
const config = require('../config');

const cron = require('node-cron');
const Logger = require('../services/logger');

let scheduler = async () => {
    cron.schedule(
        '00 00 * * *',
        async () => {
            Logger.log.trace('Updating quote at 12:00AM.');
            let quote = await Quote.find({ isPublished: true });
            if (quote.length !== 0) {
                let selectedQuoteIndex = Math.floor(Math.random() * quote.length);

                let org = await Organization.findOne({
                    organizationId: config.organization.organizationId,
                });

                org.quote = quote[selectedQuoteIndex]._id;
                await org.save();
            }
        },
        {
            scheduled: true,

            timezone: 'Australia/Melbourne',
        },
    ).start();
};

module.exports = {
    scheduler,
};
