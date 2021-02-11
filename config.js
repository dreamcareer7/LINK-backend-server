let uploadLocations = {
    admin: {
        base: 'admin-data/',
        profile: 'profile-pic/',
    },
};

module.exports = {
    twoFA: {
        generatorName: 'Linkfluencer',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'SimpleJWT',
        clientExpireTimeInHours: process.env.CLIENT_EXPIRE_TIME_IN_HOURS || '720', //in hrs
        adminExpireTimeInHours: process.env.ADMIN_EXPIRE_TIME_IN_HOURS || '2', //in hrs
        twoFAExpireTimeInHours: process.env.TWO_FA_TOKEN_EXPIRE_TIME_IN_MINUTES || '5', //in hrs
    },
    backEndBaseUrl: process.env.BACKEND_BASE_URL || 'http://localhost:3500/',
    forgotOrSetPasswordExpTime: process.env.FORGOT_PASSWORD_EXPIRE_TIME || '10', //in mins
    uploadLocations: uploadLocations,
    adminUrls: {
        adminFrontEndBaseUrl: process.env.ADMIN_FRONTEND_BASE_URL || 'http://localhost:4200/',
        resetPasswordPage: 'authAdmin/reset-password/',
        setPasswordPage: 'authAdmin/set-password/',
    },
    clientUrls: {
        clientFrontEndBaseUrl: process.env.CLIENT_FRONTEND_BASE_URL || 'http://localhost:4700/',
        forgotPasswordPage: 'forgot/',
    },
    linkFluencer: {
        paymentPageUrl: 'https://linkfluencer.com/order',
        apiKey: process.env.LINKFLUENCER_API_KEY,
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
        alertLogLevel: process.env.ALERT_LOG_LEVEL || 'error',
        teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL,
        mongoDBConnectionUrl: process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/Link',
    },
    linkedIn: {
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        inviteeScrapIntervalInMinutes: parseFloat(process.env.INVITEE_SCRAP_INTERVAL_IN_MINUTES) || 180,
    },
    firebase: {
        dbUrl: process.env.FIREBASE_DB_URL,
    },
};
