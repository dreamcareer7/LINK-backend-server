const nodemailer = require('nodemailer');
/**
 * Config
 * */
const config = require('../config');
/**
 * Services
 * */
const Logger = require('./../services/logger');
const clientInvitation = require('./../static-files/client-invitation.template');
const clientOnBoard = require('./../static-files/client-on-boarding.template');
const clientFollowUps = require('./../static-files/client-follow-ups.template');
const adminOnBoard = require('./../static-files/admin-on-board.template');
const adminForgotPassword = require('./../static-files/admin-forgot-password.template');

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
        let dt = new Date();
        dt.setHours(23, 59, 59);
        toAddress.forEach((toAddr) => {
            toAddressStr += toAddr + ', ';
        });
        toAddressStr.substr(0, toAddressStr.lastIndexOf(','));
        switch (mailFor) {
            case 'admin-forgot-password':
                html = adminForgotPassword({
                    firstName: text.firstName,
                    lastName: text.lastName,
                    resetPasswordLink: text.resetPasswordLink,
                });
                break;
            case 'admin-on-board':
                html = adminOnBoard({
                    firstName: text.firstName,
                    lastName: text.lastName,
                    setPasswordLink: text.setPasswordLink,
                });
                break;
            case 'client-invitation':
                html = clientInvitation({
                    linkFluencerLink: text.linkFluencerLink,
                    firstName: text.firstName,
                    lastName: text.lastName,
                    email: text.email,
                    phone: text.phone,
                });
                break;
            case 'client-follow-ups':
                html = clientFollowUps({
                    firstName: text.firstName,
                    lastName: text.lastName,
                    opportunities: text.opportunities,
                    dashboardUrl: text.dashboardUrl,
                });
                break;
            case 'client-on-boarding':
                html = clientOnBoard({
                    linkedInSignUpLink: text.linkedInSignUpLink,
                    firstName: text.firstName,
                    lastName: text.lastName,
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
