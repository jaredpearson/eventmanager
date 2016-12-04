'use strict';

const _root = '../../..';
const router = require('express').Router();
const auth = require(_root + '/middlewares/auth');
const hasPerm = require(_root + '/middlewares/hasPerm');

router.get('/setup/invitation', auth(), hasPerm('manageUsers'), (req, res) => {
    res.render('pages/setup/invitation/directions');
});

module.exports.router = router;
