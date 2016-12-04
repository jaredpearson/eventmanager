'use strict';

const router = require('express').Router();

router.use(require('./welcome').router);
router.use(require('./new_user_setup').router);

module.exports.router = router;