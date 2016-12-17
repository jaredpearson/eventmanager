'use strict';

var router = require('express').Router();

router.use(require('./events').router);
router.use(require('./events_eventid').router);
router.use(require('./registrations').router);
router.use(require('./registrations_registrationid').router);

module.exports.router = router;