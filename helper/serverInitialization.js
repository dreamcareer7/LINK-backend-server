const mongoose = require('mongoose');
const Admin = mongoose.model('admin');
const mailHelper = require('./mailer.helper');
const Organization = mongoose.model('organization');
const org = require('../upload/organization.json');

/**
 * config
 * */
const config = require('./../config');
/**
 * Services
 * */
const Logger = require('./../services/logger');

let createAdmin = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let access = 'auth';
            let existingAdmin = await Admin.findOne({ email: config.organization.adminEmail });
            if (existingAdmin) {
                Logger.log.trace('Admin already exists');
                return resolve();
            }
            let newAdmin = new Admin({
                email: config.organization.adminEmail,
            });
            await newAdmin.save();
            let admin = await Admin.findOne({ email: config.organization.adminEmail });
            Logger.log.trace('Admin did not existed, created one with email:', config.organization.adminEmail);
            let token = admin.getTokenForPassword();
            let link = config.adminUrls.adminFrontEndBaseUrl + config.adminUrls.setPasswordPage + `?token=${token}`;
            admin.forgotOrSetPasswordToken = token;

            await admin.save();
            let mailObj = { toAddress: [admin.email], subject: 'Set Password Link', text: link };
            mailHelper.sendMail(mailObj);
        } catch (e) {
            Logger.log.error('Error creating new Admin', e.message || e);
            return reject(e);
        }
    });
};

let createOrganization = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let existingOrganization = await Organization.findOne({
                organizationId: config.organization.organizationId,
            });
            if (existingOrganization) {
                existingOrganization.errorMessages = org.errorMessages;
                existingOrganization.industries = org.industries;
                existingOrganization.gender = org.gender;

                await existingOrganization.save();
                Logger.log.trace('Organization is Updated.');
                return resolve();
            }

            let newOrganization = new Organization({
                organizationId: config.organization.organizationId,
                errorMessages: org.errorMessages,
                industries: org.industries,
                gender: org.gender,
            });

            await newOrganization.save();
            Logger.log.trace('New Organization is Created.');
        } catch (e) {
            Logger.log.error('Error creating Organization Admin', e.message || e);
            return reject(e);
        }
    });
};

module.exports = {
    createAdmin,
    createOrganization,
};
