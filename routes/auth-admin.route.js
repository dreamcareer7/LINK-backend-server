const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Admin = mongoose.model('admin');
const passwordHash = require('password-hash');
const config = require('../config');
const authMiddleWare = require('../middleware/authenticate');
const mailHelper = require('../helper/mailer.helper');
const Logger = require('../services/logger');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrCode = require('qrcode');
var fs = require('fs');

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
        if (admin.isTwoFAEnabled) {
            let jwtSecret = config.jwtSecret;
            let access = 'auth';
            let expiryTime = parseInt(config.jwtExpireTime.twoFAToken) * 60 * 1000 + new Date().getTime();
            let token = jwt
                .sign({ _id: admin._id.toHexString(), access, expiryTime: expiryTime }, jwtSecret)
                .toString();
            res.status(200).send({
                status: 'PROMPT_FOR_OTP',
                data: {
                    token: token,
                },
            });
        } else {
            let token = admin.getAuthToken();

            admin.jwtToken.push(token);
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
        }
    } catch (e) {
        Logger.log.error('Error in login API call', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});
/**
 * Call for 2FA Verification
 */
router.post('/verify-2fa', async (req, res) => {
    try {
        let token = req.body.token;
        let code = req.body.code;
        let jwtSecret = config.jwtSecret;
        decoded = jwt.verify(token, jwtSecret);
        if (!decoded) {
            return res.status(401).send({
                status: 'INVALID_TOKEN',
                message: 'Invalid Token',
            });
        }
        let currentTime = new Date();
        if (currentTime.getTime() > decoded.expiryTime) {
            return res.status(401).send({
                status: 'TOKEN_EXPIRED',
                message: 'Token expired',
            });
        }
        let admin = await Admin.findOne({
            _id: decoded._id,
        });
        if (!admin) {
            return res.status(400).send({
                status: 'ADMIN_NOT_FOUND',
                message: 'Invalid Details.',
            });
        }
        let verified = speakeasy.totp.verify({ secret: admin.twoFASecretKey, encoding: 'base32', token: code });
        if (!verified) {
            return res.status(401).send({
                status: 'INVALID_CODE',
                message: 'Entered code is Invalid.',
            });
        }
        token = admin.getAuthToken();

        admin.jwtToken.push(token);
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
logout admin
*/

router.post('/logout', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let admin = await Admin.findOne({ _id: req.admin._id, isDeleted: false });
        if (!admin) {
            return res.status(400).send({
                status: 'ADMIN_NOT_FOUND',
                message: 'admin is not found.',
            });
        }

        admin.jwtToken.splice(admin.jwtToken.indexOf(req.admin.token), 1);
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
        if (!admin) {
            return res.status(400).send({
                status: 'ADMIN_NOT_FOUND',
                message: 'admin is not found.',
            });
        }
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

/*
update admin password
*/

router.post('/change-password', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        let admin = await Admin.findOne({ _id: req.admin._id, isDeleted: false });
        if (!admin) {
            return res.status(400).send({
                status: 'ADMIN_NOT_FOUND',
                message: 'admin is not found.',
            });
        }
        if (passwordHash.verify(req.body.oldPassword, admin.password)) {
            admin.password = req.body.newPassword;
            await admin.save();
            return res.status(200).send({
                status: 'SUCESS',
                message: 'Password is sucessfully updated.',
            });
        } else {
            return res.status(400).send({
                status: 'ERROR',
                message: 'Old password is not matched.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in update Admin password API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
/*
admin forgot password
*/
router.post('/forgot-password', async (req, res) => {
    try {
        if (!req.body.email) {
            return res.status(400).send({
                status: 'EMIALID_REQUIRED',
                message: 'Email Id is required.',
            });
        }
        let admin = await Admin.findOne({ email: req.body.email, isDeleted: false });
        if (!admin) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Email Id is not found',
            });
        }
        let token = admin.getTokenForPassword();
        let link = config.adminUrls.adminFrontEndBaseUrl + config.adminUrls.forgotPasswordPage + `?token=${token}`;
        admin.forgotOrSetPasswordToken = token;
        await admin.save();
        let mailObj = { toAddress: [admin.email], subject: 'Reset Password Link', text: link };
        mailHelper.sendMail(mailObj);
        res.status(200).send({
            status: 'SUCESS',
            message: `Reset password link is sent in your registerd Email and This link is expired in ${config.forgotOrSetPasswordExpTime} Minutes.`,
        });
    } catch (e) {
        Logger.log.error('Error in forgot Admin password API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
admin reset password 
*/
router.put('/reset-password', async (req, res) => {
    try {
        let d = new Date();
        if (!req.body.password || !req.body.confirmPassword || !req.query.token) {
            return res.status(400).send({
                status: 'REQUIRED',
                message: 'Password Confirm Password and Token is required.',
            });
        }
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).send({
                status: 'NOT_MATCHED',
                message: 'Password and Confirm Password is does not matched !',
            });
        }
        decoded = jwt.verify(req.query.token, config.jwtSecret);
        let admin = await Admin.findOne({ _id: decoded._id, isDeleted: false });
        if (admin && decoded) {
            if (admin.forgotOrSetPasswordToken === req.query.token) {
                if (decoded.expiredTime > d.getTime()) {
                    admin.password = req.body.password;
                    admin.forgotOrSetPasswordToken = null;
                    await admin.save();
                    return res.status(200).send({
                        status: 'SUCESS',
                        message: 'Your Password is sucessfully reset.',
                    });
                } else {
                    admin.forgotOrSetPasswordToken = null;
                    await admin.save();
                    return res.status(400).send({
                        status: 'EXPIRED_LINK',
                        message: 'Reset Password link is Expired !',
                    });
                }
            } else {
                admin.forgotOrSetPasswordToken = null;

                await admin.save();
                return res.status(400).send({
                    status: 'TOKEN_NOT_FOUND',
                    message: 'Token not found in DB !',
                });
            }
        } else {
            return res.status(500).send({
                status: 'ERROR',
                message: 'Invalid Token or Admin is not Find.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in reset Admin password API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
/**
 * Call for generate 2FA
 */
router.get('/generate-2fa', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        // let adminId = req.admin.id;
        // let admin = await Admin.findOne({_id: adminId});
        let admin = req.admin;
        if (!admin.twoFASecretKey) {
            var secret = speakeasy.generateSecret().base32;
            admin.twoFASecretKey = secret;
        }
        let secretUrl = `otpauth://totp/${admin.email}?secret=${secret}&issuer=${config.twoFA.generatorName}`;
        qrCode.toDataURL(secretUrl, async function(err, data_url) {
            var data = data_url.replace(/^data:image\/\w+;base64,/, '');
            var buf = Buffer.from(data, 'base64');
            fs.writeFileSync('image.png', buf);
            await admin.save();
            res.status(200).json({
                status: 'SUCCESS',
                data: {
                    twoFASecretKey: admin.twoFASecretKey,
                    qrCode: config.backEndBaseUrl + 'authAdmin/fetch-qr-code/' + admin._id,
                },
            });
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
 * Call for reading QR Code of 2FA
 */
router.get('/fetch-qr-code/:id', async (req, res) => {
    try {
        let adminId = req.params.id;
        let admin = await Admin.findOne({ _id: adminId });
        let secretUrl = `otpauth://totp/${admin.email}?secret=${admin.twoFASecretKey}&issuer=${config.twoFA.generatorName}`;
        qrCode.toDataURL(secretUrl, async function(err, data_url) {
            var data = data_url.replace(/^data:image\/\w+;base64,/, '');
            var buf = Buffer.from(data, 'base64');
            res.writeHead(200, { 'Content-Type': 'image/png' }).end(buf, 'binary');
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
 * Call for updating 2FA Settings
 */
router.put('/configure-2fa', authMiddleWare.adminAuthMiddleWare, async (req, res) => {
    try {
        if (!req.body.hasOwnProperty('twoFAStatus') || (req.body.twoFAStatus && !req.body.code)) {
            Logger.log.error('Required fields missing.');
            return res.status(400).send({
                status: '2FA_STATUS_OR_CODE_NOT_FOUND',
                message: '2FA Status or Code not found.',
            });
        }
        let admin = req.admin;
        if (req.body.twoFAStatus) {
            let code = req.body.code;
            let verified = speakeasy.totp.verify({ secret: admin.twoFASecretKey, encoding: 'base32', token: code });
            if (verified) {
                admin.isTwoFAEnabled = req.body.twoFAStatus;
            } else {
                return res.status(400).send({
                    status: 'INVALID_CODE',
                    message: 'Entered code is Invalid.',
                });
            }
        } else {
            admin.isTwoFAEnabled = req.body.twoFAStatus;
        }
        await admin.save();
        res.status(200).json({
            status: 'SUCCESS',
            message: '2FA status ' + (req.body.twoFAStatus ? 'enabled' : 'disabled'),
        });
    } catch (e) {
        Logger.log.error('Error in configure 2FA API call', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});
/*
Set Password
*/
router.put('/set-password', async (req, res) => {
    try {
        let d = new Date();
        if (!req.body.password || !req.body.confirmPassword || !req.query.token) {
            return res.status(400).send({
                status: 'REQUIRED',
                message: 'Password Confirm Password and Token is required.',
            });
        }
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).send({
                status: 'NOT_MATCHED',
                message: 'Password and Confirm Password is does not matched !',
            });
        }
        decoded = jwt.verify(req.query.token, config.jwtSecret);
        let admin = await Admin.findOne({ _id: decoded._id, isDeleted: false });
        if (admin && decoded) {
            if (admin.forgotOrSetPasswordToken === req.query.token) {
                if (decoded.expiredTime > d.getTime()) {
                    admin.password = req.body.password;
                    admin.forgotOrSetPasswordToken = null;

                    await admin.save();
                    return res.status(200).send({
                        status: 'SUCESS',
                        message: 'Your Password is sucessfully set.',
                    });
                } else {
                    admin.forgotOrSetPasswordToken = null;

                    await admin.save();
                    return res.status(400).send({
                        status: 'EXPIRED_LINK',
                        message: 'Set Password link is Expired !',
                    });
                }
            } else {
                admin.forgotOrSetPasswordToken = null;

                await admin.save();
                return res.status(400).send({
                    status: 'TOKEN_NOT_FOUND',
                    message: 'Token not found in DB !',
                });
            }
        } else {
            return res.status(500).send({
                status: 'ERROR',
                message: 'Invalid Token or Admin is not Find.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in set Admin password API call', e.message || e);
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
