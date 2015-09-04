'use strict';

var router = require('express').Router();

router.use(require('./default').router);
router.use(require('./login').router);
router.use(require('./home').router);

module.exports.router = router;