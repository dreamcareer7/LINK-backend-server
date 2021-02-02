const mongoose = require('mongoose');
const Admin = mongoose.model('admin');
const mailHelper = require('./mailer.helper');
const Organization = mongoose.model('organization');
const org = require('../static-files/organization.json');

/**
 * config
 * */
const config = require('./../config');
/**
 * Services
 * */
const Logger = require('./../services/logger');

/**
 * admin created by system
 */

let createAdmin = () => {
    return new Promise(async (resolve, reject) => {
        try {
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
            let setPasswordLink = config.adminUrls.adminFrontEndBaseUrl + config.adminUrls.setPasswordPage + token;
            admin.forgotOrSetPasswordToken = token;

            await admin.save();
            //TODO add mailFor
            let mailObj = {
                toAddress: [admin.email],
                subject: 'Set Password Link',
                text: {
                    setPasswordLink,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                },
                mailFor: 'admin-on-board',
            };
            mailHelper.sendMail(mailObj);
        } catch (e) {
            Logger.log.error('Error creating new Admin', e.message || e);
            return reject(e);
        }
    });
};
/**
 * organization created by system
 */

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
                existingOrganization.companySize = org.companySize;
                existingOrganization.stage = org.stage;
                existingOrganization.likelyHood = org.likelyHood;

                await existingOrganization.save();

                Logger.log.trace('Organization is Updated.');
                return resolve();
            }

            let newOrganization = new Organization({
                organizationId: config.organization.organizationId,
                errorMessages: org.errorMessages,
                industries: org.industries,
                gender: org.gender,
                companySize: org.companySize,
                stage: org.stage,
                likelyHood: org.likelyHood,
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
