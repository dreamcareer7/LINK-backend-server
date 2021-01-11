const mongoose = require('mongoose');
const Organization = mongoose.model('organization');
const cron = require('node-cron');
const Logger = require('../services/logger');

let scheduler = () => {
    cron.schedule(
        '* * * * *',
        async () => {
            Logger.log.trace('Updating quote at 12:00AM.');
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
