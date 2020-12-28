/**
 * System and 3rd party libs
 */
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
const fs = require('fs');
let mongoose = require('mongoose');

/**
 * Required Services
 */
let Logger = require('./services/logger');

/**
 * Global declarations
 */
let models = path.join(__dirname, 'models');
let dbURL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/Link';

/**
 * Bootstrap Models
 */
fs.readdirSync(models).forEach((file) => require(path.join(models, file)));

/**
 * Bootstrap App
 */
let app = express();
app.use(Logger.morgan);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/**
 * Import and Register Routes
 */
let index = require('./routes/index');
let admin = require('./routes/admin.route');
let quote = require('./routes/quote.route');
let firebaseHelper = require('./helper/firebase-notification');

app.use('/', index);
app.use('/admin', admin);
app.use('/quote', quote);

firebaseHelper.sendNotification({
    tokens: [
        'ee6mTSa81alptOLiB7S9pf:APA91bGqIjpKJVbtPdnAZFhh6RW7H-ZxRL4-omcp4wk9qnLXkkEhlIqiJvqydvbPoFK0CJ4uMxVH0lKPvUEt0PtpmQHQVLKoV4pXqcBO439eAkR0Z2uaENQSEDQq0G4M517HAgDZ3_np',
        'ear0T5n8g0Nq4LjkiMLwCs:APA91bHwZL_6ahomtqmRpDvvPnijoArpgmXZF-aJQwXsmMtjTZOhM0GzTT_cLfv5NX65FOHyHSjfPcbrPFbqJNByMlFeomoB5o5REvYT7rTBx5zaiHxSiDlVuhYRjg1hte8qq19UbldZ',
        'ear0T5n8g0Nq4LjkiMLwCs:APA91bHwZL_6ahomtqmRpDvvPnijoArpgmXZF-aJQwXsmMtjTZOhM0GzTT_cLfv5NX65FOHyHSjfPcbrPFbqJNByMlFeomoB5o5REvYT7rTBx5zaiHxSiDlVuhYRjg1hte8qq19UbldZ',
        'flGWe8sxmFrFG9WArF8YdB:APA91bFpxbLoVLXSROFDhYOZlAzTrdujPXA0FEkSMCNwezTBMR7Nddo2-_sSApXFZFQqIWnNJTB47BJ2YgLBeNLUvV17H64567hieuQD9bXGHrLOeakfyIh8ccghSe11O1kvdgimZ5I4',
        'eapCacnQVCfNGzm68p2Gnm:APA91bFHFx7BhQCCmoDn7BOorvjJQuqPfrR8arHVnfvrnSwd6SFN_RKEo7iVdVVqygmY3cNP9iAAiX6Ag00NyiA9KHmC2BQGRaWDxLbRNaLB3m6H55ExERSVPSGU1wCsfy0DOmu5__ld',
        'fMYqrFVhCdmtLRVNDBHrkB:APA91bGq7ZQzlAcTqqaiPRzNVuRTpcUujHf7EYJjVRDYmIKOnIlGBBiLuRYOK_TLpopnBTLCOwgNvQI1zWLArp95ZshAoBsYgl5AML8BP-zwBSCI4Ff0inYUMEied1v8zmT26cLibjnx',
        'fIdI_mxp3hg_c-2FsyAAPu:APA91bH-AN6DpUIbrJ6HXEgYEG7Tn0FkwRhzvia1w5MqHj3ciiKLSynuMgPxD-5fuDEYlwdiZ39Ps6XZYjvaaFaQFZZpzdGbHcn32jy7vvWbxlv9iJ2jP-GMUgC684TOgZCNTIMmaJHR',
    ],
    data: { name: 'Parth Mansata', company: 'Kevit Technologies' },
});
/**
 * Create Admin
 */
let ServerInitializer = require('./helper/serverInitialization');
ServerInitializer.createAdmin();

/**
 * Catch 404 routes
 */
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/**
 * Error Handler
 */
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.json(err);
});

/**
 * Mongoose Configuration
 */
mongoose.Promise = global.Promise;

mongoose.connection.on('connected', () => {
    Logger.log.info('DATABASE - Connected');
});

mongoose.connection.on('error', (err) => {
    Logger.log.error('DATABASE - Error:' + err);
});

mongoose.connection.on('disconnected', () => {
    Logger.log.warn('DATABASE - disconnected  Retrying....');
});

let connectDb = function() {
    const dbOptions = {
        poolSize: 5,
        reconnectTries: Number.MAX_SAFE_INTEGER,
        reconnectInterval: 500,
        useNewUrlParser: true,
    };
    mongoose.connect(dbURL, dbOptions).catch((err) => {
        Logger.log.fatal('DATABASE - Error:' + err);
    });
};

connectDb();
module.exports = app;
