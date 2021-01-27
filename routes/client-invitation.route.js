const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const config = require('../config');
const Logger = require('../services/logger');
const jwt = require('jsonwebtoken');
const mailHelper = require('../helper/mailer.helper');

/**
 * send invitation to client by admin
 */

router.post('/send-invitation', async (req, res) => {
    try {
        if (
            !req.body.hasOwnProperty('firstName') ||
            !req.body.hasOwnProperty('lastName') ||
            !req.body.hasOwnProperty('email') ||
            !req.body.hasOwnProperty('phone')
        ) {
            return res.status(400).send({
                status: 'REQUIRED_FIELD_MISSING',
                message: 'Required is field missing.',
            });
        }
        let client = await Client.findOne({ email: req.body.email, isDeleted: false });
        if (client) {
            return res.status(400).send({
                status: 'ALREADY_SENT',
                message: 'Invitation Already Sent.',
            });
        }

        let newClient = new Client({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            isInvited: true,
            isSubscribed: false,
        });
        await newClient.save();
        let access = 'auth';
        newClient.invitedToken = jwt.sign({ _id: newClient._id.toHexString(), access }, config.jwt.secret).toString();
        await newClient.save();
        let linkedInLink = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.linkedIn.clientId}&redirect_uri=${config.backEndBaseUrl}client-auth/sign-up-invitation?requestedToken=${newClient.invitedToken}&&state=fooobar&scope=r_emailaddress,r_liteprofile`;
        let mailObj = {
            toAddress: [newClient.email],
            subject: 'Link Fluencer Invitation link.',
            text: {
                linkedInLink,
                firstName: newClient.firstName,
                lastName: newClient.lastName,
                email: newClient.email,
                phone: newClient.phone,
            },
            mailFor: 'client-invitation',
        };
        mailHelper.sendMail(mailObj);
        return res.status(200).send({
            status: 'SUCCESS',
            message: `Invitation Successfully Sent to ${newClient.email}.`,
        });
    } catch (e) {
        Logger.log.error('Error in Client Invitation API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 *
 * delete invitation of unsubscribed users  by admin
 */

router.delete('/delete-invitation/:id', async (req, res) => {
    try {
        let clients = await Client.findOne({ _id: req.params.id, isDeleted: false, isInvited: true }).select(
            '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
        );
        if (!clients) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Client is not found.',
            });
        }
        if (clients.isSubscribed) {
            return res.status(400).send({
                status: 'CAN_NOT_DELETE',
                message: 'Can not delete Subscribed Users.',
            });
        } else {
            await Client.findByIdAndDelete(req.params.id);
            return res.status(200).send({
                status: 'SUCCESS',
                message: 'Client deleted Successfully.',
            });
        }
    } catch (e) {
        Logger.log.error('Error in Get Client Invitation API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * get invitations of client
 */

router.get('/get-invitations', async (req, res) => {
    try {
        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);
        let clients = await Client.paginate(
            { isInvited: true, isSubscribed: false },
            {
                page,
                limit,
                select:
                    '-opportunitys -jwtToken -notificationType -notificationPeriod -tags -cookie -ajaxToken -invitedToken',
            },
        );
        if (!clients) {
            return res.status(400).send({
                status: 'NOT_FOUND',
                message: 'Not Invitation Sent Yet.',
            });
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: clients,
        });
    } catch (e) {
        Logger.log.error('Error in Get Client Invitation API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});

/**
 * Download subscribers by admin
 */
router.get('/get-invitations/download', async (req, res) => {
    try {
        let clients = await Client.find({ isDeleted: false, isInvited: true, isSubscribed: false })
            .select(
                'firstName lastName email phone title industry companyName linkedInUrl companySize companyLocation selectedPlan',
            )
            .lean();
        let fields = ['first-name', 'last-name', 'email', 'phone'];
        const rawJson = clients.map((x) => {
            return {
                'first-name': x.firstName,
                'last-name': x.lastName,
                email: x.email,
                phone: x.phone,
            };
        });
        const json2csvParser = new Parser({ fields });
        const csvData = json2csvParser.parse(rawJson);
        res.header('Content-Type', 'text/csv');
        res.send(csvData);
    } catch (e) {
        Logger.log.error('Error in download invited users API call', e.message || e);
        return res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 * Export Router
 */
module.exports = router;
