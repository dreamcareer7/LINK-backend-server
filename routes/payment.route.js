const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Payment = mongoose.model('payment');
const Logger = require('../services/logger');
const config = require('../config');
const mailHelper = require('./../helper/mailer.helper');

/**
 * Stripe Webhook
 */
router.post('/stripe-webhook', async (req, res) => {
    try {
        let eventType = req.body.type;
        let reqData = req.body.data.object;
        console.log('Webhook Received::', JSON.stringify(req.body, null, 3));
        switch (eventType) {
            case 'customer.created':
                if (reqData.metadata && reqData.metadata.jayla_customer_id) {
                    let client = await Client.findOne({ _id: reqData.metadata.jayla_customer_id });
                    if (client) {
                        Logger.log.info('Client is invited by the admin');
                        client.stripeCustomerId = reqData.id;
                        client.isDeleted = false;
                        await client.save();
                    } else {
                        Logger.log.info('ClientId found in metadata, but not found in DB, creating a new one.');
                        client = new Client({
                            stripeCustomerId: reqData.id,
                            email: reqData.email,
                        });
                        await client.save();
                    }
                } else {
                    Logger.log.info('ClientId not found in metadata, creating a new one.');
                    let client = new Client({
                        stripeCustomerId: reqData.id,
                        email: reqData.email,
                    });
                    await client.save();
                }
                break;
            case 'customer.subscription.created':
                if (reqData.status !== 'trialing') {
                    Logger.log.error(
                        'Initial status by Stripe is not trialing, ignoring the subscription:',
                        reqData.id,
                    );
                } else {
                    let client = await Client.findOne({
                        stripeCustomerId: reqData.customer,
                    });
                    if (!client) {
                        Logger.log.error('Customer not found with the Stripe Customer Id:', reqData.customer);
                    } else {
                        console.log('client exists', client);
                        client.isSubscribed = true;
                        if (!client.selectedPlan) {
                            client.selectedPlan = {};
                        }
                        client.selectedPlan.status = 'FREE_TRIAL';
                        client.selectedPlan.trialEndDate = new Date(reqData.trial_end * 1000);
                        if (reqData.plan.interval === 'month') {
                            client.selectedPlan.planSelected = 'MONTHLY';
                        } else if (reqData.plan.interval === 'year') {
                            client.selectedPlan.planSelected = 'YEARLY';
                        }
                    }
                    let payment = new Payment({
                        stripeSubscriptionId: reqData.id,
                        clientId: client._id,
                        planType: client.selectedPlan.status,
                        paymentAmount: reqData.plan.amount,
                        stripePlanId: reqData.plan.id,
                    });
                    // let linkedInSignUpLink =
                    //     config.backEndBaseUrl + 'client-auth/sign-up?subscription_id=' + reqData.id;
                    // https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=776gktki6ukrgj&redirect_uri=https://4266a98bc90c.ngrok.io/client-auth/sign-up-extension&state=fooobar&scope=r_emailaddress,r_liteprofile
                    let linkedInSignUpLink =
                        'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=' +
                        config.linkedIn.clientId +
                        '&redirect_uri=' +
                        config.backEndBaseUrl +
                        'client-auth/sign-up?subscription_id=' +
                        reqData.id +
                        '&state=fooobar&scope=r_emailaddress,r_liteprofile';
                    let mailObj = {
                        toAddress: [client.email],
                        subject: 'Onboarding to Jayla App',
                        text: {
                            linkedInSignUpLink,
                            firstName: client.firstName,
                            lastName: client.lastName,
                        },
                        mailFor: 'client-on-boarding',
                    };
                    let promiseArr = [];
                    promiseArr.push(payment.save());
                    promiseArr.push(client.save());
                    promiseArr.push(mailHelper.sendMail(mailObj));
                    await Promise.all(promiseArr);
                    console.log('linkedInSignUpLink::', linkedInSignUpLink);
                }
                break;
            case 'customer.subscription.updated':
                if (reqData.status === 'active') {
                    Logger.log.info('Subscription changed to active:', reqData.id);
                    let payment = await Payment.findOne({
                        stripeSubscriptionId: reqData.id,
                    });
                    if (!payment) {
                        Logger.log.error('Subscription not found with the Stripe Subscription Id:', reqData.id);
                    } else {
                        let client = await Client.findOne({
                            _id: payment.clientId,
                        });
                        client.isSubscribed = true;
                        if (reqData.plan.interval === 'month') {
                            client.selectedPlan.status = 'MONTHLY';
                            client.selectedPlan.planSelected = 'MONTHLY';
                            payment.planType = 'MONTHLY';
                        } else if (reqData.plan.interval === 'year') {
                            client.selectedPlan.status = 'YEARLY';
                            client.selectedPlan.planSelected = 'YEARLY';
                            payment.planType = 'YEARLY';
                        }
                        payment.stripeNotification.push({
                            subscriptionStatus: reqData.status,
                            subscriptionInterval: reqData.plan.interval,
                            receivedAt: new Date(),
                        });
                        await payment.save();
                        await client.save();
                    }
                }
                break;
        }
        Logger.log.info('Successfully processed the Stripe Webhook for event:', eventType);
        return res.status(200).send();
    } catch (e) {
        Logger.log.error('Error in add opportunity API call.', e.message || e);
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
