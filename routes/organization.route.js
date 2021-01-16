const express = require('express');
const config = require('../config');
const router = express.Router();
const mongoose = require('mongoose');
const Organization = mongoose.model('organization');
const Logger = require('../services/logger');
const authMiddleWare = require('../middleware/authenticate');

/**
 *
 * get quote
 */

router.get('/admin-today-quote', authMiddleWare.adminAuthMiddleWare, async function(req, res) {
    try {
        let org = await Organization.findOne({
            organizationId: config.organization.organizationId,
        }).populate('quote');
        res.status(200).send({
            status: 'SUCCESS',
            data: org.quote,
        });
    } catch (e) {
        Logger.log.error('Error in admin-today-quote API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 *
 * get industries
 */

router.get('/admin-industries', authMiddleWare.adminAuthMiddleWare, async function(req, res) {
    try {
        let org = await Organization.findOne({
            organizationId: config.organization.organizationId,
        });
        res.status(200).send({
            status: 'SUCCESS',
            data: org.industries,
        });
    } catch (e) {
        Logger.log.error('Error in admin-industries API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
/**
 * get companysize
 */
router.get('/admin-companysize', authMiddleWare.adminAuthMiddleWare, async function(req, res) {
    try {
        let org = await Organization.findOne({
            organizationId: config.organization.organizationId,
        });
        res.status(200).send({
            status: 'SUCCESS',
            data: org.companySize,
        });
    } catch (e) {
        Logger.log.error('Error in admin-companysize API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 *
 * get quote
 */

router.get('/client-today-quote', authMiddleWare.clientAuthMiddleWare, async function(req, res) {
    try {
        let org = await Organization.findOne({
            organizationId: config.organization.organizationId,
        }).populate('quote');
        res.status(200).send({
            status: 'SUCCESS',
            data: org.quote,
        });
    } catch (e) {
        Logger.log.error('Error in client-today-quote API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 *
 * get industries
 */

router.get('/client-industries', authMiddleWare.clientAuthMiddleWare, async function(req, res) {
    try {
        let org = await Organization.findOne({
            organizationId: config.organization.organizationId,
        });
        res.status(200).send({
            status: 'SUCCESS',
            data: org.industries,
        });
    } catch (e) {
        Logger.log.error('Error in client-industries API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
/**
 * get companysize
 */
router.get('/client-companysize', authMiddleWare.clientAuthMiddleWare, async function(req, res) {
    try {
        let org = await Organization.findOne({
            organizationId: config.organization.organizationId,
        });
        res.status(200).send({
            status: 'SUCCESS',
            data: org.companySize,
        });
    } catch (e) {
        Logger.log.error('Error in client-companysize API call', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
module.exports = router;
