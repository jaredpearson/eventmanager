'use strict';

var router = require('express').Router();

router.use(require('./default').router);
router.use(require('./login').router);
router.use(require('./logout').router);
router.use(require('./home').router);
router.use(require('./events').router);
router.use(require('./events_new').router);
router.use(require('./events_eventid').router);
router.use(require('./events_eventid_registrations').router);
router.use(require('./invitation').router);
router.use(require('./services').router);
router.use(require('./setup').router);

module.exports.router = router;