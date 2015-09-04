'use strict';

// middleware that ensures a user has been authenticated
module.exports = function(req, res, next) {

    if (!req.session.user_id) {
        res.redirect('/login');
    } else {
        next();
    }

};
