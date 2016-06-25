'use strict';

const router = require('express').Router();
const auth = require('../../../middlewares/auth');
const hasPerm = require('../../../middlewares/hasPerm');
const usersDataSource = require('../../../data_sources/users');
const ui = require('../../../ui');
const util = require('../../../util');

router.get('/setup/users/:userId', auth(), hasPerm('manageUser'), (req, res) => {
    const userId = req.params.userId;
    if (!userId || !util.isInt(userId)) {
        res.sendStatus(404);
        return;
    }
    const contextUserId = req.session.user_id;

    usersDataSource.getUserById(userId)
        .then((user) => {
            if (!user) {
                res.sendStatus(404);
                return;
            }
            res.render('pages/setup/users/view', {
                user: user
            });
        })
        .fail(function(err) {
            ui.showErrorPage(res, err);
        })
        .done();

});

module.exports.router = router;