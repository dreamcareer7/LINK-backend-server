/**
 * Services Structure
 */

/**
 * System and 3rd party libs
 */
const log4js = require('log4js');
const morgan = require('morgan');
const config = require('../config');

/**
 * Declarations & Implementations
 */

let appenders = {
    out: { type: 'stdout' },
    allLogs: { type: 'file', filename: 'all.log', maxLogSize: 10485760, backups: 10, compress: true },
    outFilter: {
        type: 'logLevelFilter',
        appender: 'out',
        level: config.server.logLevel || 'all',
    },
};
let categories = { default: { appenders: ['allLogs', 'outFilter'], level: 'all' } };
if (config.server.teamsWebhookUrl) {
    appenders['teamsAlert'] = {
        type: '@kevit/log4js-teams',
        webhookUrl: config.server.teamsWebhookUrl,
    };
    appenders['teamsFilter'] = {
        type: 'logLevelFilter',
        appender: 'teamsAlert',
        level: config.server.alertLogLevel,
    };
    categories.default.appenders.push('teamsFilter');
}
log4js.configure({
    appenders: appenders,
    categories: categories,
});

let log = log4js.getLogger();

let morganInstance = morgan('dev', {
    stream: {
        write: (str) => {
            log.debug(str);
        },
    },
});

/**
 * Service Export
 */
module.exports = {
    log: log,
    morgan: morganInstance,
};
