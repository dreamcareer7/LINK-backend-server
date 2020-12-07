const mongoose = require('mongoose');
const Admin = mongoose.model('admin');
const jwt = require('jsonwebtoken');
const mailHelper = require('./mailer.helper');

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
            let token = jwt.sign({ _id: admin._id.toHexString(), access }, config.jwtSecret).toString();
            let link = config.adminUrls.adminFrontEndBaseUrl + config.adminUrls.setPasswordPage + `?token=${token}`;
            let d = new Date();
            admin.forgotOrSetPassword.expiredTime = parseInt(config.forgotOrSetPasswordExpTime) * 60000 + d.getTime();
            admin.forgotOrSetPassword.token = token;
            await admin.save();
            let mailObj = { toAddress: [admin.email], subject: 'set Password Link', text: link };
            mailHelper.sendMail(mailObj);
        } catch (e) {
            Logger.log.error('Error creating new Admin', e.message || e);
            return reject(e);
        }
    });
};

module.exports = {
    createAdmin,
};
