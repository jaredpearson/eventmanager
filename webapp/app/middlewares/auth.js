'use strict';

const usersDataSource = require('../data_sources/users');

// middleware that ensures a user has been authenticated
module.exports = function(req, res, next) {
    const goToLoginPage = () => {
        res.redirect('/login');
    };

    if (!req.session.user_id) {
        goToLoginPage();

    } else {

        const userId = req.session.user_id;
        usersDataSource.getUserById(userId)
            .then((user) => {
                if (user) {
                    req.user = user;
                    next();

                } else {
                    goToLoginPage();
                }
            })
            .fail((err) => {
                goToLoginPage();
            })
            .done();

    }

};
