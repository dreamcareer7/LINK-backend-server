const express = require('express');
const { connectLogger } = require('log4js');
const router = express.Router();
const mongoose = require('mongoose');
const { compile } = require('morgan');
const { route } = require('.');
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

/*
 update admin data
 */

router.post('/update/:id', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        if (req.admin._id != req.params.id) {
            return res.status(200).send({
                status: 'ERROR',
                message: `Can not update Admin by other Admins`,
            });
        }
        let admin = await Admin.findOne({ _id: req.admin._id, isDeleted: false });
        if (!admin) {
            return res.status(400).send({
                status: 'ADMIN_NOT_FOUND',
                message: 'admin is not found.',
            });
        }

        admin.firstName = req.body.firstName;
        admin.lastName = req.body.lastName;
        admin.email = req.body.email;
        admin.phone = req.body.phone;
        admin.profileUrl = req.body.profileUrl;
        await admin.save();
        admin.password = undefined;
        return res.status(200).send({
            status: 'SUCCESS',
            data: admin,
        });
    } catch (e) {
        Logger.log.error('Error in update Admin API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
/*
 inactive admin 
 */

router.delete('/delete/:id', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        if (req.admin._id == req.params.id) {
            return res.status(200).send({
                status: 'ERROR',
                message: `Can not delete Admin by it's Self`,
            });
        } else {
            let admin = await Admin.findOne({ _id: req.params.id, isDeleted: false });
            if (!admin) {
                return res.status(400).send({
                    status: 'ADMIN_NOT_FOUND',
                    message: 'admin is not found.',
                });
            }
            admin.isDeleted = true;
            admin.jwtToken = [];
            await admin.save();
            return res.status(200).send({
                status: 'SUCCESS',
                data: {
                    isDeleted: admin.isDeleted,
                },
            });
        }
    } catch (e) {
        Logger.log.error('Error in delete Admin API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
active admin
*/
router.put('/active/:id', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        if (req.admin._id == req.params.id) {
            return res.status(200).send({
                status: 'ERROR',
                message: `Can Active Admin by it's Self`,
            });
        } else {
            let admin = await Admin.findOne({ _id: req.params.id, isDeleted: true });
            if (!admin) {
                return res.status(400).send({
                    status: 'ADMIN_NOT_FOUND',
                    message: 'admin is not found.',
                });
            }
            admin.isDeleted = false;

            await admin.save();
            return res.status(200).send({
                status: 'SUCCESS',
                data: {
                    isDeleted: admin.isDeleted,
                },
            });
        }
    } catch (e) {
        Logger.log.error('Error in active Admin API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
get all admin
*/

router.get('/all-admin', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let admins = await Admin.find({});

        admins.forEach((admin) => {
            admin.jwtToken = undefined;
            admin.password = undefined;
        });
        res.status(200).json({
            status: 'SUCESS',
            data: admins,
        });
    } catch (e) {
        Logger.log.error('Error in get all Admin API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
logout admin
*/

router.post('/logout', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let admin = await Admin.findOne({ _id: req.admin._id, isDeleted: false });
        for (let i = 0; i < admin.jwtToken.length; i++) {
            if (admin.jwtToken[i].token === req.admin.token) {
                admin.jwtToken.splice(i, 1);
                break;
            }
        }
        admin.save();
        res.status(200).json({
            status: 'SUCESS',
            message: 'Admin is Sucessfully logout.',
        });
    } catch (e) {
        Logger.log.error('Error in logout Admin API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/** 
 logout from all devices
*/
router.post('/logout-all-devices', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let admin = await Admin.findOne({ _id: req.admin._id, isDeleted: false });
        admin.jwtToken = [];
        admin.save();
        res.status(200).json({
            status: 'SUCESS',
            message: 'Admin is Sucessfully logout from all devices.',
        });
    } catch (e) {
        Logger.log.error('Error in logout Admin from all devices API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 * Export Router
 */
module.exports = router;
