const nodemailer = require('nodemailer');
/**
 * Config
 * */
const config = require('../config');
/**
 * Services
 * */
const Logger = require('./../services/logger');
const clientFollowUps = require('./../static-files/client-follow-ups.template');

const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: 'apikey',
        pass: config.mailer.sendgridApiKey,
    },
});

const sendMail = ({ toAddress, subject, text, html, mailFor }) => {
    return new Promise((resolve, reject) => {
        let toAddressStr = '';
        toAddress.forEach((toAddr) => {
            toAddressStr += toAddr + ', ';
        });
        toAddressStr.substr(0, toAddressStr.lastIndexOf(','));
        switch (mailFor) {
            case 'admin-forgot-password':
                //TODO Attach template

                // html = adminForgotPassword({
                //     firstName: text.firstName,
                //     lastName: text.lastName,
                //     resetPasswordLink: text.resetPasswordLink,
                // });
                break;
            case 'admin-on-board':
                //TODO Attach template

                // html = adminForgotPassword({
                //     firstName: text.firstName,
                //     lastName: text.lastName,
                //     setPasswordLink: text.setPasswordLink,
                // });
                break;
            case 'client-invitation':
                //TODO Attach template

                // html = adminForgotPassword({
                //     firstName: text.firstName,
                //     lastName: text.lastName,
                //     linkedInLink: text.linkedInLink,
                //     email: text.email,
                //     phone: text.phone,
                // });
                break;
            case 'client-follow-ups':
                //TODO Attach template

                html = clientFollowUps({
                    firstName: text.firstName,
                    lastName: text.lastName,
                    opportunities: text.opportunities,
                    dashboardUrl: text.dashboardUrl,
                });
                break;
            //TODO Consider this case on successful payment
            case 'client-on-boarding':
                html = adminForgotPassword({
                    firstName: text.firstName,
                    lastName: text.lastName,
                    linkedInLink: text.linkedInLink,
                    email: text.email,
                    phone: text.phone,
                });
                break;
        }
        const mailBody = {
            from: config.mailer.fromAddress,
            to: toAddressStr,
            subject: subject,
            html: html,
        };

        if (!mailBody.html) mailBody.text = text;
        if (typeof mailBody.text !== 'string') mailBody.text = JSON.stringify(text, null, 2);

        if (config.mailer.send === 'true') {
            transporter.sendMail(mailBody, (err, info) => {
                if (err) {
                    Logger.log.error('Error sending mail:', err.message || err);
                    reject(err);
                } else {
                    Logger.log.info('Mail sent Successfully:', info);
                    resolve(info);
                }
            });
        } else {
            resolve({
                message: 'SkippedSendMail',
                description:
                    'The Mailer did not send mail because of the process configs, set "SEND_MAIL"=true in environment to enable mail service',
                mailObject: mailBody,
            });
        }
    });
};

module.exports = {
    sendMail,
};
