module.exports = {
    twoFA: {
        generatorName: 'Linkfluencer',
    },
    jwtSecret: process.env.JWT_SECRET || 'SimpleJWT',
    expireTime: process.env.EXPIRE_TIME || '2', //in hrs
    backEndBaseUrl: process.env.BACKEND_BASE_URL || 'http://localhost:3500/',
    forgotOrSetPasswordExpTime: process.env.FORGOT_PASSWORD_EXPIRE_TIME || '10', //in mins
    adminUrls: {
        adminFrontEndBaseUrl: process.env.ADMIN_FRONTEND_BASE_URL || 'http://localhost:4200/',
        forgotPasswordPage: 'forgot/',
        setPasswordPage: 'setPassword/',
    },
    clientUrls: {
        clientFrontEndBaseUrl: process.env.CLIENT_FRONTEND_BASE_URL || 'http://localhost:4700/',
        forgotPasswordPage: 'forgot/',
    },
    environment: process.env.ENVIRONMENT || 'local',
    mailer: {
        fromAddress: process.env.FROM_EMAIL_ADDRESS || 'pratik.rajkotiya@kevit.io',
        sendgridApiKey: process.env.SENDGRID_API_KEY,
        send: process.env.SEND_MAIL || true,
    },
    organization: {
        adminEmail: process.env.ADMIN_EMAIL || 'pratik.rajkotiya@kevit.io',
        adminPassword: process.env.ADMIN_PASSWORD || '12345',
        organizationId: 'LINK_ORG',
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
    linkedIn: {
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    },
    firebase: {
        dbUrl: process.env.FIREBASE_DB_URL,
    },
};
