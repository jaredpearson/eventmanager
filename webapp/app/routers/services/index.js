'use strict';

var router = require('express').Router();

router.use(require('./registrations').router);
router.use(require('./registrations_registrationid').router);

module.exports.router = router;