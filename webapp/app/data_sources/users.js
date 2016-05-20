'use strict';

var db = require('../db');

module.exports = {
    getMaxUsernameLength: () => 100,

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
                    return result.rows[0].users_id;
                } else {
                    return undefined;
                }
            })
            .then(function(selectedUserId) {
                userId = selectedUserId;
                return selectedUserId;
            })
            .then(function(){
                if (!userId) {
                    return client.query('UPDATE Users SET login_attempts = login_attempts + 1 WHERE username = $1::TEXT', [username]);
                }

                return client.query('UPDATE Users SET login_attempts = 0, login_lock_timestamp = NULL, last_login = CURRENT_TIMESTAMP, number_of_logins = number_of_logins + 1 WHERE users_id = $1::INTEGER', [userId])
            })
            .then(function() {
                return client.query('COMMIT');
            })
            .then(function() {
                return userId;
            })
            .fin(function() {
                if (client) {
                    client.done();
                }
            });
    },

    createUser: function(username, password, email, firstName, lastName) {
        return db.query('INSERT INTO Users (username, password, email, first_name, last_name) VALUES ($1::TEXT, crypt($2::TEXT, gen_salt(\'bf\', 11)), $3::TEXT, $4::TEXT, $5::TEXT) RETURNING users_id', [username, password, email, firstName, lastName])
            .then((result) => {
                if (result.rowCount > 0) {
                    return result.rows[0].users_id;
                } else {
                    return undefined;
                }
            });
    }
};