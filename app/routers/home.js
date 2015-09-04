'use strict';

var router = require('express').Router(),
    auth = require('../middlewares/auth');

router.get('/home', auth, function(req, res) {
    res.render('pages/home');
});

module.exports.router = router;