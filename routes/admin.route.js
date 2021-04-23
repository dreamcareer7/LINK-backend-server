const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Admin = mongoose.model('admin');
const config = require('../config');
const authMiddleWare = require('../middleware/authenticate');
const mailHelper = require('../helper/mailer.helper');
const Logger = require('../services/logger');

const uploadProfilePath = path.resolve(__dirname, '../upload/' + getProfileImagePath());
//Custom Multer storage engine
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadProfilePath);
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ dest: uploadProfilePath, storage: storage });

/**
 * Upload for profile-picture of Admin.
 */
router.post('/upload/profile-pic', upload.single('profile-pic'), async (req, res) => {
    try {
        let adminId = req.admin._id;
        if (!adminId) {
            Logger.log.error('Admin id not found in the logged in admin');
            return res.status(400).send({
                status: 'ERROR',
                message: 'Admin not found, please try by logging in again.',
            });
        }
        // await Admin.updateOne({ _id: adminId }, { profilePic: req.file.filename });
        let profilePicUrl = getProfileUrl(req.file.filename);
        res.status(200).send({
            status: 'SUCCESS',
            data: {
                profilePicUrl,
            },
        });
    } catch (e) {
        Logger.log.error('Error in upload profile picture API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
        });
    }
});

/**
 * Remove profile-picture of Admin.
 */
router.delete('/profile-pic', async (req, res) => {
    let adminId = req.admin._id;
    if (!adminId) {
        Logger.log.error('Admin id not found in the logged in admin');
        return res.status(400).send({
            status: 'ERROR',
            message: 'Admin not found, please try by logging in again.',
        });
    }
    if (!req.query.oldImageName) {
        Logger.log.error('In delete profile picture call, old image name not present for the admin:', adminId);
        return res.status(400).send({
            status: 'ERROR',
            message: 'Image name not found, unable to remove old profile picture.',
        });
    }
    let imagePath = path.resolve(__dirname + '/../upload/' + getProfileImagePath() + req.query.oldImageName);
    fs.unlink(imagePath, async (err) => {
        if (err) {
            Logger.log.warn(
                `Error deleting profile picture with name: ${req.query.oldImageName} by user ${req.admin._id}`,
            );
            Logger.log.warn(err.message || err);
            return res.status(500).send('Error removing profile picture.');
        } else {
            Logger.log.info('Successfully deleted old profile picture.');
            await Admin.updateOne({ _id: adminId }, { profilePic: null });
            res.status(200).send({
                status: 'SUCCESS',
                message: 'Profile Picture removed successfully.',
            });
        }
    });
});

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
        let setPasswordLink = config.adminUrls.adminFrontEndBaseUrl + config.adminUrls.setPasswordPage + token;
        admin.forgotOrSetPasswordToken = token;
        await admin.save();
        let mailObj = {
            toAddress: [admin.email],
            subject: 'Invitation to become an admin',
            text: {
                setPasswordLink,
                firstName: admin.firstName,
                lastName: admin.lastName,
            },
            mailFor: 'admin-on-board',
        };
        mailHelper.sendMail(mailObj);
        res.status(200).json({
            status: 'SUCCESS',
            message: `Admin successfully signed up. Set password link is sent to the registered email and will expire in ${config.forgotOrSetPasswordExpTime} Minutes.`,
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
 * Get loggedIn admin data
 *
 */

router.get('/get-loggedIn-admin', async (req, res) => {
    try {
        let admin = await Admin.findOne({ _id: req.admin._id, isDeleted: false }).select(
            '-password -jwtToken -forgotOrSetPasswordToken -isDeleted -twoFASecretKey',
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

router.get('/get-admin/:id', async (req, res) => {
    try {
        let admin = await Admin.findOne({ _id: req.params.id, isDeleted: false })
            .select('-password -jwtToken -forgotOrSetPasswordToken -isDeleted -twoFASecretKey')
            .lean();

        if (req.admin._id.toString() === admin._id.toString()) {
            admin.isLoggedIn = true;
        } else {
            admin.isTwoFAEnabled = undefined;
        }

        if (!admin) {
            return res.status(400).send({
                status: 'ADMIN_NOT_FOUND',
                message: 'admin is not found.',
            });
        }
        admin.profilePic = getProfileUrl(admin.profilePic);
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
router.put('/update/:id', async (req, res) => {
    try {
        let admin = await Admin.findOne({ _id: req.params.id, isDeleted: false }).select(
            '-password -jwtToken -forgotOrSetPasswordToken -isDeleted -twoFASecretKey',
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
        admin.profilePic = req.body.profilePic;
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
/**
 * enable-disable-2fa for admin
 */

router.put('/enable-disable-2fa', async (req, res) => {
    try {
        let admin = req.admin;
        admin.isTwoFAEnabled = req.body.isTwoFAEnabled;
        await admin.save();
        return res.status(200).send({
            status: 'SUCCESS',
            data: { isTwoFAEnabled: admin.isTwoFAEnabled },
        });
    } catch (e) {
        Logger.log.error('Error in TwoFAEnabled for Admin API call', e.message || e);
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
        let admins = await Admin.find({ isDeleted: false })
            .select('-password -jwtToken -forgotOrSetPasswordToken -isDeleted -twoFASecretKey -isTwoFAEnabled')
            .lean();

        for (let i = 0; i < admins.length; i++) {
            admins[i].profilePic = getProfileUrl(admins[i].profilePic);
            if (req.admin._id.toString() == admins[i]._id.toString()) {
                admins[i].isLoggedIn = true;
            }
        }
        res.status(200).json({
            status: 'SUCCESS',
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
 * Helper Functions
 */
function getProfileImagePath() {
    return config.uploadLocations.admin.base + config.uploadLocations.admin.profile;
}

function getProfileUrl(imageName) {
    if (imageName)
        if (imageName.indexOf(config.backEndBaseUrl + getProfileImagePath()) !== -1) return imageName;
        else return config.backEndBaseUrl + getProfileImagePath() + imageName;
    return '';
}

/**
 * Export Router
 */
module.exports = router;
