const Logger = require('../services/logger');
const mongoose = require('mongoose');
const Admin = mongoose.model('admin');
const Client = mongoose.model('client');

let adminAuthMiddleWare = async (req, res, next) => {
    let token = req.header('authorization');
    if (token) {
        try {
            let admin = await Admin.findByToken(token);
            admin.password = undefined;
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
let clientAuthMiddleWare = async (req, res, next) => {
    let token = req.header('authorization');
    console.log('----', token);
    if (token) {
        try {
            let client = await Client.findByToken(token);

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
module.exports = {
    adminAuthMiddleWare,
    clientAuthMiddleWare,
};
