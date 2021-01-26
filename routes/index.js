/**
 * Router Configuration Files
 */

/**
 * System and 3rd party libs
 */
const express = require('express');
const router = express.Router();

/**
 * Router Definitions
 */
router.get('/', function(req, res, next) {
    res.send('Hello, This is root');
});
/**
 * Router Definitions
 */
router.post('/', function(req, res, next) {
    console.log('BODY::', JSON.stringify(req.body, null, 3));
    console.log('QUERY::', JSON.stringify(req.query, null, 3));
    // console.log('HEADERS::', req.headers);
    res.send('Hello, This is root');
});

/**
 * Export Router
 */
module.exports = router;
