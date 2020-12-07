/**
 * Model Definition File
 */

/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const config = require('../config');
const { schema } = require('./organization.model');
const Schema = mongoose.Schema;
const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const { connectLogger } = require('log4js');
const logger = require('./../services/logger');
/**
 * Schema Definition
 */
const adminSchema = new Schema(
    {
        firstName: Schema.Types.String,
        lastName: Schema.Types.String,
        email: Schema.Types.String,
        phone: Schema.Types.String,
        password: Schema.Types.String,
        profileUrl: Schema.Types.String,
        isDeleted: { type: Schema.Types.Boolean, default: false },
        jwtToken: [
            {
                expiredTime: Schema.Types.Number,
                token: Schema.Types.String,
            },
        ],
        forgotPassword: {
            expiredTime: Schema.Types.Number,
            token: Schema.Types.String,
        },
    },
    { timestamps: true },
);

/**
 * Finds Admin from token
 * @param token
 */
adminSchema.statics.findByToken = async function(token) {
    let admin = this;
    let decoded;
    let jwtSecret = config.jwtSecret;
    let d = new Date();
    let flag = false;
    let counter;
    let adminData;

    try {
        decoded = jwt.verify(token, jwtSecret);
        adminData = await admin.findOne({
            _id: decoded._id,
        });
        for (let i = 0; i < adminData.jwtToken.length; i++) {
            if (adminData.jwtToken[i].token === token) {
                flag = true;
                counter = i;
                break;
            }
        }

        if (flag) {
            if (adminData.jwtToken[counter].expiredTime > d.getTime()) {
                decoded = jwt.verify(token, jwtSecret);
                return adminData;
            } else {
                adminData.jwtToken.splice(counter, 1);
                await adminData.save();
                return Promise.reject({ status: 'TOKEN_EXPIRED', message: 'JwtToken is expired' });
            }
        } else {
            return Promise.reject({ status: 'TOKEN_NOT_FOUND', message: 'JwtToken is not found' });
        }
    } catch (e) {
        return Promise.reject({ status: 'INVALID_TOKEN', message: 'Cannot decode token' });
    }
};

/**
 * Generates Hash of the password before storing to database
 */
adminSchema.pre('save', function(next) {
    var admin = this;
    if (admin.isModified('password')) {
        admin.password = passwordHash.generate(admin.password);
        next();
    } else {
        next();
    }
});

/**
 * Finds admin from database and compares password
 * @param email
 * @param password
 */
adminSchema.statics.findByCredentials = function(email, password) {
    let admin = this;
    return admin.findOne({ email, isDeleted: false }).then((admin) => {
        if (!admin) {
            return Promise.reject({
                status: 'INVALID_EMAIL_OR_PASSWORD',
                message: 'Incorrect email or password.',
            });
        }
        return new Promise((resolve, reject) => {
            if (passwordHash.verify(password, admin.password)) {
                return resolve(admin);
            } else {
                logger.log.warn('Wrong Password for email:', admin.email);
                return reject({
                    status: 'INVALID_EMAIL_OR_PASSWORD',
                    message: 'Incorrect email or password.',
                });
            }
        });
    });
};

/**
 * Generates token at the time of Login call
 */
adminSchema.methods.getAuthToken = function() {
    let a = this;
    let jwtSecret = config.jwtSecret;
    let access = 'auth';
    let token = jwt.sign({ _id: a._id.toHexString(), access }, jwtSecret).toString();
    return token;
};
/**
 * Export Schema
 */
module.exports = mongoose.model('admin', adminSchema);