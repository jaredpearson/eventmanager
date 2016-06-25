'use strict';

const usersDataSource = require('../data_sources/users');

/**
 * Validates the user ID retrieved from the session is valid for the
 * current request.
 * @param {number} userId the ID of the user
 * @param {function(string|Object, Object)} done callback to signal that the 
 * function is done varifying the userID
 */
function validate(userId, done) {
    usersDataSource.getUserById(userId)
        .then((user) => {
            if (user) {
                done(undefined, user);
            } else {
                done('No user found with Id');
            }
        })
        .fail((err) => done(err))
        .done();
}

/**
 * middleware that ensures a user has been authenticated. If the user ID
 * is not found in the session or the user ID can't be found in the database,
 * the user sent back to the login page.
 */
module.exports = () => {

    return (req, res, next) => {
        const goToLoginPage = () => {
            res.redirect('/login');
        };

        if (!req.session.user_id) {
            goToLoginPage();

        } else {

            const userId = req.session.user_id;
            validate(userId, (err, user) => {
                if (err) {
                    console.log(err);
                    goToLoginPage();
                } else {
                    req.user = user;
                    next();
                }
            });

        }

    };
    
};
