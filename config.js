module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'SimpleJWT',
    BaseUrl: process.env.BASE_URL || 'http://localhost:3500/',
    environment: process.env.ENVIRONMENT || 'local',
    mailer: {
        fromAddress: process.env.FROM_EMAIL_ADDRESS || 'pratik.rajkotiya@kevit.io',
        sendgridApiKey: process.env.SENDGRID_API_KEY,
        send: process.env.SEND_MAIL || true,
    },
    server: {
        port: process.env.PORT || 3500,
        logLevel: process.env.LOG_LEVEL || 'all',
        alertLogLevel: process.env.ALERT_LOG_LEVEL || 'all',
        mongoDBConnectionUrl: process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/Link',
    },
    stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
    },
};
