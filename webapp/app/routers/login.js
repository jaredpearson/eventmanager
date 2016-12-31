'use strict';

const router = require('express').Router();
const userDataSource = require('../data_sources/users');
const ui = require('../ui');

router.get('/login', (req, res) => {
    const options = {};
    if (req.query.username && req.query.username.trim().length > 0) {
        options.username = req.query.username.trim();
    }
    res.render('pages/login', options);
});

router.post('/login', (req, res) => {
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
        .then((userId) => {
            if (userId) {
                req.session.user_id = userId;
                res.redirect('/home');
            } else {
                res.render('pages/login', {
                    errors: ['Username or password is incorrect. Please try again.']
                });
            }
        })
        .fail(ui.showErrorPageCurry(res))
        .done();
});

module.exports.router = router;
