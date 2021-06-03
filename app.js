/**
 * System and 3rd party libs
 */
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
const fs = require('fs');
let mongoose = require('mongoose');
const cors = require('cors');

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
app.use(express.static(path.join(__dirname, 'upload')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

app.use(
    cors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
        credentials: true,
    }),
);

let authMiddleWare = require('./middleware/authenticate');
/**
 * Import and Register Routes
 */
let index = require('./routes/index');
let admin = require('./routes/admin.route');
let authAdmin = require('./routes/auth-admin.route');
let quote = require('./routes/quote.route');
let errorMessage = require('./routes/error-messages.route');
let clientErrorMessage = require('./routes/client-error-messages.route');
let clientAuth = require('./routes/client-auth.route');
let invitee = require('./routes/invitee.route');
let opportunity = require('./routes/opportunity.route');
let opportunityNote = require('./routes/opportunity-note.route');
let subscribers = require('./routes/subscribers.route');
let clientInvitation = require('./routes/client-invitation.route');
let adminAnalytics = require('./routes/admin-analytics.route');
let clientAnalytics = require('./routes/client-dashboard.route');
let clientDashboardUpdated = require('./routes/client-dashboard-updated.route');
let clientReporting = require('./routes/client-reporting.route');
let payment = require('./routes/payment.route');
let conversation = require('./routes/conversation.route');
let clientFollowUps = require('./routes/client-follow-ups.route');
let clientCrm = require('./routes/client-crm.route');
let strategy = require('./routes/strategy.route');
let organization = require('./routes/organization.route');

app.use('/', index);
app.use('/admin', authMiddleWare.adminAuthMiddleWare, admin);
app.use('/quote', authMiddleWare.adminAuthMiddleWare, quote);
app.use('/error-message', authMiddleWare.adminAuthMiddleWare, errorMessage);
app.use('/client-error-message', clientErrorMessage);
app.use('/client-auth', clientAuth);
app.use('/authAdmin', authAdmin);
app.use('/opportunity', authMiddleWare.clientAuthMiddleWare, opportunity);
app.use('/invitee', authMiddleWare.linkedInLoggedInChecked, invitee);
app.use('/opportunity-note', authMiddleWare.clientAuthMiddleWare, opportunityNote);
app.use('/subscribers', authMiddleWare.adminAuthMiddleWare, subscribers);
app.use('/client-invitation', authMiddleWare.adminAuthMiddleWare, clientInvitation);
app.use('/admin-analytics', authMiddleWare.adminAuthMiddleWare, adminAnalytics);
app.use('/client-dashboard', authMiddleWare.clientAuthMiddleWare, clientAnalytics);
app.use('/client-dashboard-updated', authMiddleWare.clientAuthMiddleWare, clientDashboardUpdated);
app.use('/client-reporting', authMiddleWare.clientAuthMiddleWare, clientReporting);
app.use('/payment', payment);
app.use('/conversation', authMiddleWare.clientAuthMiddleWare, authMiddleWare.linkedInLoggedInChecked, conversation);
app.use('/client-follow-ups', authMiddleWare.clientAuthMiddleWare, clientFollowUps);
app.use('/client-crm', authMiddleWare.clientAuthMiddleWare, clientCrm);
app.use('/strategy', strategy);
app.use('/organization', organization);

/**
 * Create Admin
 */
let ServerInitializer = require('./helper/serverInitialization');

ServerInitializer.createAdmin();
ServerInitializer.createOrganization();

/**
 * Initialize CRON
 */

let SchedulerHelper = require('./services/cron.schedular.service');
let notificationHelper = require('./helper/notification.helper');
let inviteeHelper = require('./helper/invitee.helper');
let opportunityHelper = require('./helper/opportunity.helper');
let conversationHelper = require('./helper/conversation.helper');
notificationHelper.scheduleEmailNotification();
notificationHelper.scheduleBrowserNotification();
SchedulerHelper.scheduler();
inviteeHelper.syncInvitees();
conversationHelper.setCronToUpdateConversationList();
opportunityHelper.syncOpportunityStage();

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
