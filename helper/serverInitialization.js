const mongoose = require('mongoose');
const Admin = mongoose.model('admin');

/**
 * Config
 * */
const Config = require('./../config');
/**
 * Services
 * */
const Logger = require('./../services/logger');

let createAdmin = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let existingAdmin = await Admin.findOne({ email: Config.organization.adminEmail, isDeleted: false });
            if (existingAdmin) {
                Logger.log.trace('Admin already exists');
                return resolve();
            }
            let admin = new Admin({
                email: Config.organization.adminEmail,
                password: Config.organization.adminPassword,
            });
            await admin.save();
            Logger.log.trace('Admin did not existed, created one with email:', Config.organization.adminEmail);
        } catch (e) {
            Logger.log.error('Error creating new Admin', e.message || e);
            return reject(e);
        }
    });
};

module.exports = {
    createAdmin,
};
