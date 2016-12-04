'use strict';

var router = require('express').Router();

router.use(require('./create').router);
router.use(require('./home').router);

module.exports.router = router;
