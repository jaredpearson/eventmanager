'use strict';

const router = require('express').Router();
const auth = require('../../../middlewares/auth');
const usersDataSource = require('../../../data_sources/users');
const ui = require('../../../ui');

router.get('/setup/users', auth, (req, res) => {

    usersDataSource.getPageOfUsers()
        .then((userPage) => {
            res.render('pages/setup/users/list', {
                users: userPage.users
            });
        })
        .fail(function(err) {
            ui.showErrorPage(res, err);
        })
        .done();

});

module.exports.router = router;
