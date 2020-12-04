const Logger = require('../services/logger');
const mongoose = require('mongoose');
const Admin = mongoose.model('admin');

let adminAuthMiddleWare = async (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).send();
    }
    let token = req.header('authorization');
    if (token) {
        try {
            let admin = await Admin.findByToken(token);
            admin.password = undefined;
            if (admin) {
                req.admin = admin;
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
        return res.status(401).send('Auth-Token not set in header');
    }
};
module.exports = {
    adminAuthMiddleWare,
};
