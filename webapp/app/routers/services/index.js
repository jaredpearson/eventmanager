'use strict';

var router = require('express').Router();

router.use(require('./registrations').router);

module.exports.router = router;