/**
 * Router Configuration Files
 */

/**
 * System and 3rd party libs
 */
const express = require("express");
const router = express.Router();

/**
 * Router Definitions
 */
router.get("/", function (req, res, next) {
  res.send("Hello, This is root");
});

/**
 * Export Router
 */
module.exports = router;
