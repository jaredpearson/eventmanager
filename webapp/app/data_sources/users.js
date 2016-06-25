'use strict';

const db = require('../db');
const date = require('../date');
const moment = require('moment-timezone');

module.exports = {
    getMaxUsernameLength: () => 100,

    auth(username, password) {
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

    createUser(username, password, email, firstName, lastName) {
        return db.query('INSERT INTO Users (username, password, email, first_name, last_name) VALUES ($1::TEXT, crypt($2::TEXT, gen_salt(\'bf\', 11)), $3::TEXT, $4::TEXT, $5::TEXT) RETURNING users_id', [username, password, email, firstName, lastName])
            .then((result) => {
                if (result.rowCount > 0) {
                    return result.rows[0].users_id;
                } else {
                    return undefined;
                }
            });
    },

    getUserById(userId) {
        return db.query(`
            SELECT
                users_id id,
                username,
                email,
                first_name,
                last_name,
                created,
                login_attempts,
                login_lock_timestamp,
                last_login,
                number_of_logins,
                perm_manage_users
            FROM Users
            WHERE users_id = $1::INTEGER
            LIMIT 1`, [userId])
            .then((result) => {
                const timezone = date.getTimeZone();
                if (result.rowCount > 0) {
                    const userData = result.rows[0];
                    return {
                        id: userData.id,
                        username: userData.username,
                        email: userData.email,
                        firstName: userData.first_name,
                        lastName: userData.last_name,
                        name: (userData.first_name + ' ' + userData.last_name).trim(),
                        created: moment.tz(userData.created, 'Etc/GMT+0').tz(timezone),
                        loginAttempts: userData.login_attempts,
                        loginLock: moment.tz(userData.login_lock_timestamp, 'Etc/GMT+0').tz(timezone),
                        lastLogin: moment.tz(userData.last_login, 'Etc/GMT+0').tz(timezone),
                        numberOfLogins: userData.number_of_logins,
                        perms: {
                            manageUsers: userData.perm_manage_users
                        }
                    };
                } else {
                    return;
                }
            });
    },

    getPageOfUsers() {
        return db.query(`
        SELECT
            users_id id,
            first_name,
            last_name,
            username,
            email
        FROM Users
        ORDER BY last_name, first_name
        LIMIT 100`)
            .then((result) => {
                return result.rows.map((userData) => {
                    return {
                        id: userData.id,
                        firstName: userData.first_name,
                        lastName: userData.last_name,
                        name: (userData.first_name + ' ' + userData.last_name).trim(),
                        username: userData.username,
                        email: userData.email
                    };
                });
            })
            .then((userModels) => {
                return db.query('SELECT count(*) FROM Users')
                    .then((result) => {
                        if (result.rowCount > 0) {
                            return result.rows[0].count;
                        } else {
                            return 0;
                        }
                    })
                    .then((totalCount) => {
                        return {
                            totalCount: totalCount,
                            users: userModels,
                            hasMore: totalCount > userModels.length
                        };
                    });

            })
    }
};