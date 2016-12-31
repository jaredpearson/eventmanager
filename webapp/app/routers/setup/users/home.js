'use strict';

const router = require('express').Router();
const auth = require('../../../middlewares/auth');
const hasPerm = require('../../../middlewares/hasPerm');
const usersDataSource = require('../../../data_sources/users');
const ui = require('../../../ui');

router.get('/setup/users', auth(), hasPerm('manageUsers'), (req, res) => {

    usersDataSource.getPageOfUsers()
        .then(userPage => {
            ui.renderStandard(req, res, 'pages/setup/users/list', {
                users: userPage.users
            });
        })
        .fail(ui.showErrorPageCurry(res))
        .done();

});

module.exports.router = router;
