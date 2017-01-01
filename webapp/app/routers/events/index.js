'use strict';

const router = require('express').Router();

router.use(require('./events_new').router);
router.use(require('./events_eventid_registrations').router);
router.use(require('./events_eventid').router);
router.use(require('./home').router);

module.exports.router = router;