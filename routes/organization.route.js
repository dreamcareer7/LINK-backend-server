const express = require('express');
const config = require('../config');
const router = express.Router();
const mongoose = require('mongoose');
const Organization = mongoose.model('organization');
const Logger = require('../services/logger');

/**
 *
 * get all error message
 */

router.get('/get-organization', async function(req, res) {
    try {
        let org = await Organization.findOne({
            organizationId: config.organization.organizationId,
        });
        res.status(200).send({
            status: 'SUCCESS',
            data: org,
        });
    } catch (e) {
        Logger.log.error('Error in get-organization API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

module.exports = router;
