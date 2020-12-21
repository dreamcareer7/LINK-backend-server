const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Admin = mongoose.model('admin');
const config = require('../config');
const authMiddleWare = require('../middleware/authenticate');
const mailHelper = require('../helper/mailer.helper');
const Logger = require('../services/logger');

/**
 * Creates Admin - Sign-up Call
 */
router.post('/sign-up', async (req, res) => {
    if (!req.body.email) {
        return res.status(400).json({
            status: 'EMAIL_NOT_FOUND',
            message: 'Please enter email Id.',
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
        let newAdmin = new Admin({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
        });

        await newAdmin.save();
        let admin = await Admin.findOne({ email: req.body.email, isDeleted: false });
        let token = admin.getTokenForPassword();
        let link = config.adminUrls.adminFrontEndBaseUrl + config.adminUrls.setPasswordPage + `?token=${token}`;
        admin.forgotOrSetPasswordToken = token;
        await admin.save();
        let mailObj = { toAddress: [admin.email], subject: 'Set Password Link', text: link };
        mailHelper.sendMail(mailObj);
        res.status(200).json({
            status: 'SUCCESS',
            message: `Successfully signed up. And Set password link is sent in your registerd Email and This link is expired in ${config.forgotOrSetPasswordExpTime} Minutes.`,
        });
    } catch (e) {
        Logger.log.error('Error in sign-up API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
        });
    }
});

/**
 * Get admin data
 *
 */

router.get('/get-admin', async (req, res) => {
    try {
        let admin = await Admin.findOne({ _id: req.admin._id, isDeleted: false }).select(
            'firstName lastName email phone profileUrl',
        );

        if (!admin) {
            return res.status(400).send({
                status: 'ADMIN_NOT_FOUND',
                message: 'admin is not found.',
            });
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: admin,
        });
    } catch (e) {
        Logger.log.error('Error in get Admin API.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/*
 update admin data
 */
router.post('/update/:id', async (req, res) => {
    try {
        if (req.admin._id != req.params.id) {
            return res.status(400).send({
                status: 'ERROR',
                message: `Can not update Admin by other Admins`,
            });
        }
        let admin = await Admin.findOne({ _id: req.admin._id, isDeleted: false }).select(
            '-forgotOrSetPasswordToken -jwtToken -password',
        );
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
router.delete('/delete/:id', async (req, res) => {
    try {
        if (req.admin._id == req.params.id) {
            return res.status(400).send({
                status: 'ERROR',
                message: `Can not delete Admin by it's Self`,
            });
        } else {
            let admin = await Admin.findOne({ _id: req.params.id, isDeleted: false }).select(
                '-forgotOrSetPasswordToken -jwtToken',
            );
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
router.put('/active/:id', async (req, res) => {
    try {
        if (req.admin._id == req.params.id) {
            return res.status(400).send({
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
        let admins = await Admin.find({}).select('-forgotOrSetPasswordToken -jwtToken -password');

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

/**
 * Export Router
 */
module.exports = router;
