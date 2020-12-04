const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Admin = mongoose.model('admin');
const config = require('../config');
const authMiddleWare = require('../middleware/authenticate');

const Logger = require('../services/logger');

/**
 * Creates Admin - Sign-up Call
 */
router.post('/sign-up', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({
            status: 'EMAIL_OR_PASSWORD_NOT_FOUND',
            message: 'Please enter email and password.',
        });
    }
    try {
        let existingAdmin = await Admin.findOne({ email: req.body.email, isDeleted: false });
        if (existingAdmin) {
            return res.status(400).json({
                status: 'ADMIN_WITH_EMAIL_EXISTS',
                message: 'Admin with this email already exist in the system.',
            });
        }
        let admin = new Admin({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password,
        });

        await admin.save();

        res.status(200).json({
            status: 'SUCCESS',
            message: 'Successfully signed up.',
        });
    } catch (e) {
        Logger.log.error('Error in sign-up API call', e.message || e);
        res.status(500).json({
            status: 'Error',
            message: error.message,
        });
    }
});
/**
 * Call for Login
 */
router.post('/login', async (req, res) => {
    let userId = req.body.email;
    let password = req.body.password;
    try {
        let admin = await Admin.findByCredentials(userId, password);
        if (!admin) {
            return res.status(400).send({
                status: 'ADMIN_NOT_FOUND',
                message: 'Incorrect email or password.',
            });
        }
        let token = admin.getAuthToken();
        let d = new Date();
        admin.jwtToken.push({
            expiredTime: parseInt(config.expireTime) * 3600000 + d.getTime(),
            token: token,
        });
        await admin.save();
        res.status(200).json({
            status: 'SUCCESS',
            data: {
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                phone: admin.phone,
                _id: admin._id,
                profileUrl: admin.profileUrl,
                token: token,
            },
        });
    } catch (e) {
        Logger.log.error('Error in login API call', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * Export Router
 */
module.exports = router;
