const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/payment-data', async (req, res) => {
    try {
    } catch (e) {
        Logger.log.error('Error in  API call', e.message || e);
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
