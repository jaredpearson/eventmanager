'use strict';

var router = require('express').Router();

router.use(require('./home').router);
router.use(require('./view').router);

module.exports.router = router;
