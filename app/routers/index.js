'use strict';

var router = require('express').Router();

router.use(require('./default').router);
router.use(require('./login').router);
router.use(require('./home').router);
router.use(require('./events_new').router);

module.exports.router = router;