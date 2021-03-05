const Logger = require('../services/logger');
const axios = require('axios');
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const opportunityHelper = require('../helper/opportunity.helper');
const config = require('../config');

const cancelSubscription = async ({ stripeSubscriptionId }) => {
    try {
        let data = {
            method: 'GET',
            url: `https://linkfluencer.com/cancel-subscription?subscription_id=${stripeSubscriptionId}`,
            headers: {
                'api-key': config.linkFluencer.apiKey,
            },
        };
        let response = await axios(data);
        Logger.log.info('Response of Cancellation of Stripe:', response.data);
        if (response.data && response.data === 'SUCCESS') {
            Logger.log.info('Successfully cancelled the Subscription');
            return resolve();
        } else {
            Logger.log.error('Error in cancelling the subscription', stripeSubscriptionId);
            return Promise.reject({ message: 'Error in cancelling the Subscription.' });
        }
    } catch (e) {
        Logger.log.error('Error in cancel subscription.', e.message || e);
        return Promise.reject({ message: 'Error in cancel subscription.' });
    }
};

module.exports = {
    cancelSubscription,
};
