'use strict';

const invitationService = require('../../services/invitation_service');
const router = require('express').Router();
const ui = require('../../ui');

router.get('/invitation/welcome', (req, res) => {
    res.render('pages/invitation/welcome');
});

router.post('/invitation/welcome', (req, res) => {
    const inviteCode = req.body.code;
    const errors = [];

    if (!inviteCode || inviteCode.trim().length === 0) {
        errors.push('An invite code is required.')
    }
    
    if (errors.length > 0) {
        res.render('pages/invitation/welcome', {
            errors
        });
        return;
    }

    invitationService.validate(inviteCode)
        .then((inviteValidationResult) => {
            if (!inviteValidationResult || !inviteValidationResult.valid) {
                res.render('pages/invitation/welcome', {
                    errors: ['The invite code is invalid or expired. Check that it was typed in properly and try again.']
                });
            } else {
                res.redirect('/invitation/newUserSetup?c=' + inviteCode);
            }
        })
        .fail(ui.showErrorPageCurry(res))
        .done();
});

module.exports.router = router;