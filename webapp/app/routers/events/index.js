'use strict';

const router = require('express').Router();

router.use(require('./home').router);

module.exports.router = router;