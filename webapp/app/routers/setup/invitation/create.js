'use strict';

const _root = '../../..';
const router = require('express').Router();
const auth = require(_root + '/middlewares/auth');
const hasPerm = require(_root + '/middlewares/hasPerm');
const invitationService = require(_root + '/services/invitation_service');
const ui = require(_root + '/ui');

router.post('/setup/invitation/create', auth(), hasPerm('manageUsers'), (req, res) => {
    const contextUserId = req.session.user_id;
    invitationService.create(contextUserId)
        .then((invite) => {
            res.render('pages/setup/invitation/create_success', {
                invite
            });
        })
        .fail((err) => ui.showErrorPage(res, err))
        .done();
});

module.exports.router = router;
