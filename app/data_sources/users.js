'use strict';

var db = require('../db'),
    Q = require('q');

module.exports = {
    getMaxUsernameLength: function() {
        return 100;
    },

    auth: function(username, password) {
        var client,
            userId;

        return db.connect()
            .then(function(c) {
                client = c;
                return client.query('BEGIN');
            })
            .then(function() {
                return client.query('SELECT users_id FROM Users WHERE username = $1::TEXT AND password = crypt($2::TEXT, password)', [username, password])
            })
            .then(function(result) {
                if (result.rowCount > 0) {
                    return Q(result.rows[0].users_id);
                } else {
                    return Q(undefined);
                }
            })
            .then(function(selectedUserId) {
                userId = selectedUserId;
                return Q(selectedUserId);
            })
            .then(function(){
                if (!userId) {
                    return Q(undefined);
                }

                return client.query('UPDATE Users SET login_attempts = 0 AND login_lock_timestamp = NULL, last_login = CURRENT_TIMESTAMP, number_of_logins = number_of_logins + 1 WHERE users_id = $1::INTEGER', [userId])
            })
            .then(function() {
                return client.query('COMMIT');
            })
            .fin(function() {
                client.done();
                return Q(userId)
            });
    }
};