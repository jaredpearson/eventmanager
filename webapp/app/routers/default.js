'use strict';

var router = require('express').Router();

router.get('/', function(req, res) {
    res.redirect('/home');
});

module.exports.router = router;
