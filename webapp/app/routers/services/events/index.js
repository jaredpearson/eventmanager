'use strict';

var router = require('express').Router();

router.use(require('./feeditems').router);

module.exports.router = router;