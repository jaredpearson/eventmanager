'use strict';

var router = require('express').Router(),
    userDataSource = require('../data_sources/users'),
    ui = require('../ui');

router.get('/login', function(req, res) {
    res.render('pages/login');
});

router.post('/login', function(req, res) {
    var errors = [];
    if (!req.body.username || req.body.username > userDataSource.getMaxUsernameLength()) {
        errors.push('Username is not valid');
    }
    if (!req.body.password) {
        errors.push('Password is required')
    }
    if (errors.length > 0) {
        res.render('pages/login', {
            errors: errors
        });
        return;
    }

    userDataSource.auth(req.body.username, req.body.password)
        .then(function(userId) {
            if (userId) {
                req.session.user_id = userId;
                res.redirect('/home');
            } else {
                res.render('pages/login', {
                    errors: ['Username or password is incorrect. Please try again.']
                });
            }
        })
        .fail(function(err) {
            ui.showErrorPage(res, err);
        })
        .done();
});

module.exports.router = router;