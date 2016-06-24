'use strict';

var router = require('express').Router();

router.use(require('./users').router);

module.exports.router = router;
