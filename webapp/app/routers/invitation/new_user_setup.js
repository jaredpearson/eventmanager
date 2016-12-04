'use strict';

const invitationService = require('../../services/invitation_service');
const userDataSource = require('../../data_sources/users');
const ui = require('../../ui');
const router = require('express').Router();

function isPasswordValid(password) {
    if (!password) {
        return false;
    }

    // must be at least 8 characters
    return password.length >= 8 &&

        // must have a digit
        /[0-9]/.test(password) &&

        // must have a character
        /[a-z]/i.test(password);
}

function isUsernameValid(username) {
    if (!username) {
        return false;
    }

    // must be email-like
    // must contain '@'
    return /[^@]@[^@]/.test(username) &&
        // no spaces
        !/\s/.test(username);
}

router.get('/invitation/newUserSetup', (req, res) => {
    // make the user has a valid invite code
    const inviteCode = req.query.c;
    invitationService.validate(inviteCode)
        .then((inviteValidationResult) => {
            if (!inviteValidationResult || !inviteValidationResult.valid) {
                res.redirect('/invitation/welcome');
                return;
            }

            res.render('pages/invitation/new_user_setup', {
                fields: {
                    inviteCode: inviteCode
                }
            });
        })
        .fail((err) => ui.showErrorPage(res, err))
        .done();
});

router.post('/invitation/newUserSetup', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;

    // make the user has a valid invite code
    const inviteCode = req.body.inviteCode;
    invitationService.validate(inviteCode)
        .then((inviteValidationResult) => {
            if (!inviteValidationResult || !inviteValidationResult.valid) {
                res.redirect('/invitation/welcome');
                return;
            }

            const errors = [];

            if (!username) {
                errors.push('Username is required.');
            } else if (username.length > userDataSource.getMaxUsernameLength()) {
                errors.push('Username must be shorter than 100 characters.');
            } else if (!isUsernameValid(username)) {
                errors.push('Username is not in valid format. The username must contain "@" with no spaces.');
            }

            if (!email) {
                errors.push('Email is required.');
            }
            if (!firstName) {
                errors.push('First name is required.');
            }
            if (!lastName) {
                errors.push('Last name is required.');
            }
            if (!password) {
                errors.push('Password is required.');
            }
            if (password != passwordConfirm) {
                errors.push('Password and confirmation do not match.')
            }

            // verify the password
            if (password && !isPasswordValid(password)) {
                errors.push('Password must be at least 8 characters and must contain at least one number and at least one letter.')
            }
            
            if (errors.length > 0) {
                res.render('pages/invitation/new_user_setup', {
                    errors: errors,
                    fields: {
                        username: username,
                        email: email,
                        firstName: firstName,
                        lastName: lastName,
                        inviteCode: inviteCode
                    }
                });
                return;
            }

            // TODO: verify that the user name is unique
            // TODO: wrap this in a DB transaction

            return userDataSource.createUser(username, password, email, firstName, lastName)
                .then(() => invitationService.useCode(inviteCode))
                .then(() => res.redirect('/login?username=' + username));
        })
        .fail((err) => ui.showErrorPage(res, err))
        .done();

});

module.exports.router = router;