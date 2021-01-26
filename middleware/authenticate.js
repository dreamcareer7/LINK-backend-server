const Logger = require('../services/logger');
const mongoose = require('mongoose');
const Admin = mongoose.model('admin');
const Client = mongoose.model('client');
/**
 * this middleware used for authorization of admin
 */
let adminAuthMiddleWare = async (req, res, next) => {
    let token = req.header('authorization');
    if (token) {
        try {
            let admin = await Admin.findByToken(token);
            if (admin) {
                req.admin = admin;
                req.admin.token = token;
                next();
            } else {
                res.status(401).send('Auth-Token is not valid');
            }
        } catch (e) {
            Logger.log.error('Error occurred.', e.message || e);
            return res.status(401).send({ message: 'Invalid Auth-Token' });
        }
    } else {
        Logger.log.warn('JWT - Auth-Token not set in header');
        return res.status(401).send({ message: 'Auth-Token not set in header' });
    }
};

/**
 * this middleware used for authorization of client
 */
let clientAuthMiddleWare = async (req, res, next) => {
    let token = req.header('authorization');
    //console.log('----', token);
    if (token) {
        try {
            let client = await Client.findByToken(token);
            console.log('Client in Client Auth..', client);
            if (client) {
                req.client = client;
                req.client.token = token;
                next();
            } else {
                res.status(401).send('Auth-Token is not valid');
            }
        } catch (e) {
            Logger.log.error('Error occurred.', e.message || e);
            return res.status(401).send({ message: 'Invalid Auth-Token' });
        }
    } else {
        Logger.log.warn('JWT - Auth-Token not set in header');
        return res.status(401).send({ message: 'Auth-Token not set in header' });
    }
};

let linkedInLoggedInChecked = async (req, res, next) => {
    let token = req.header('authorization');

    if (token) {
        try {
            let client = await Client.findByToken(token);
            console.log('client::', client);
            req.client = client;
            // if (client.publicIdentifier === client.loggedInIdentifier) {
            next();
            // } else {
            //     return res.status(401).json({
            //         status: 'NOT_AUTHORIZED',
            //         message: 'LinkedIn account is not registered.',
            //     });
            // }
        } catch (e) {
            Logger.log.error('Error occurred.', e.message || e);
            return res.status(401).send({ message: 'Invalid Auth-Token' });
        }
    } else {
        Logger.log.warn('JWT - Auth-Token not set in header');
        return res.status(401).send({ message: 'Auth-Token not set in header' });
    }
};

module.exports = {
    adminAuthMiddleWare,
    clientAuthMiddleWare,
    linkedInLoggedInChecked,
};
