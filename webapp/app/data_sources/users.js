'use strict';

const db = require('../db');
const moment = require('moment-timezone');
const q = require('q');

/**
 * Converts the given date in GMT+0 to the given timezone. If the date is not
 * defined, then undefined is returned.
 */
function convertDateToTimezone(date, timezone) {
    if (typeof date === 'undefined' || date === null) {
        return date;
    }
    return moment.tz(date, 'Etc/GMT+0').tz(timezone)
}

/**
 * Gets the default timezone for dates.
 * @returns {String}
 */
function getDefaultTimeZone() {
    return 'America/Los_Angeles';
}

/**
 * Fetches the user ID associated to the username and password.
 * @returns {Promise} that returns the user ID or undefined if the user can't be found
 */
function fetchUserId(clientPromise, username, password) {
    return clientPromise.then((client) => {
        return client.query('SELECT users_id FROM Users WHERE username = $1::TEXT AND password = crypt($2::TEXT, password)', [username, password])
            .then(function(result) {
                if (result.rowCount > 0) {
                    return result.rows[0].users_id;
                } else {
                    return undefined;
                }
            });
    });
}

/**
 * Updates the login_attempts for the specified username if the user ID is not found or updates the 
 * login statistics when the user ID is valid
 */
function updateUserLoginInformation(clientPromise, userIdPromise, usernamePromise) {
    return q.spread([clientPromise, userIdPromise, usernamePromise], (client, userId, username) => {
        if (!userId) {
            return client.query('UPDATE Users SET login_attempts = login_attempts + 1 WHERE username = $1::TEXT', [username]);
        }

        return client.query('UPDATE Users SET login_attempts = 0, login_lock_timestamp = NULL, last_login = CURRENT_TIMESTAMP, number_of_logins = number_of_logins + 1 WHERE users_id = $1::INTEGER', [userId])
    });
}

function commitAndCloseDbClient(clientPromise) {
    return () => {
        return clientPromise
            .then((client) => {
                client.query('COMMIT');
                return client.done();
            });
    };
}

/**
 * Creates a new user from the given DB row
 */
function convertDbRowToUser(userData) {
    const timezone = getDefaultTimeZone();
    return {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: (userData.firstName + ' ' + userData.lastName).trim(),
        created: convertDateToTimezone(userData.created, timezone),
        loginAttempts: userData.loginAttempts,
        loginLock: convertDateToTimezone(userData.loginLockTimestamp, timezone),
        lastLogin: convertDateToTimezone(userData.lastLogin, timezone),
        numberOfLogins: userData.numberOfLogins,
        perms: {
            manageUsers: userData.permManageUsers
        }
    };
}

module.exports = {
    getMaxUsernameLength: () => 100,

    auth(username, password) {
        const clientPromise = db.connect();
        const userIdPromise = fetchUserId(clientPromise, username, password);
        return updateUserLoginInformation(clientPromise, userIdPromise, username)
            .then(() => userIdPromise)
            .fin(commitAndCloseDbClient(clientPromise));
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

    /**
     * Gets the user with the specified ID or undefined if no user exists.
     * @param {Number} userId
     */
    getUserById(userId) {
        return db.query(`
            SELECT
                users_id "id",
                username,
                email,
                first_name "firstName",
                last_name "lastName",
                created,
                login_attempts "loginAttempts",
                login_lock_timestamp "loginLockTimestamp",
                last_login "lastLogin",
                number_of_logins "numberOfLogins",
                perm_manage_users "permManageUsers"
            FROM Users
            WHERE users_id = $1::INTEGER
            LIMIT 1`, [userId])
            .then((result) => {
                if (result.rowCount > 0) {
                    return convertDbRowToUser(result.rows[0]);
                } else {
                    return;
                }
            });
    },

    /**
     * Gets the user with the specified username or undefined if no user exists.
     * @param {String} username
     */
    getUserByUsername(username) {
        return db.query(`
            SELECT
                users_id "id",
                username,
                email,
                first_name "firstName",
                last_name "lastName",
                created,
                login_attempts "loginAttempts",
                login_lock_timestamp "loginLockTimestamp",
                last_login "lastLogin",
                number_of_logins "numberOfLogins",
                perm_manage_users "permManageUsers"
            FROM Users
            WHERE username = $1::TEXT
            LIMIT 1`, [username])
            .then((result) => {
                if (result.rowCount > 0) {
                    return convertDbRowToUser(result.rows[0]);
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