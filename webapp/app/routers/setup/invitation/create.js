'use strict';

const router = require('express').Router();
const auth = require('../../../middlewares/auth');
const hasPerm = require('../../../middlewares/hasPerm');
const invitationService = require('../../../services/invitation_service');
const ui = require('../../../ui');

router.post('/setup/invitation/create', auth(), hasPerm('manageUsers'), (req, res) => {
    const contextUserId = req.session.user_id;
    invitationService.create(contextUserId)
        .then(invite => {
            ui.renderStandard(req, res, 'pages/setup/invitation/create_success', {
                invite
            });
        })
        .fail(ui.showErrorPageCurry(res))
        .done();
});

module.exports.router = router;
