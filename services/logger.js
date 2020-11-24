/**
 * Services Structure
 */

/**
 * System and 3rd party libs
 */
const log4js = require('log4js');
const morgan = require('morgan');

/**
 * Declarations & Implementations
 */
let log = log4js.getLogger();
log.level = 'all';
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
