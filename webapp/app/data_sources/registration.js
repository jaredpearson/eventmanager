'use strict';

const db = require('../db');
const UserModel = require('../models/user');
const _ = require('underscore');

class RegistrationQueryResult {
    constructor(items, total) {
        this.items = items;
        this.total = total;
    }
}

/**
 * gets the total number of registrations for the specified event. the event ID
 * is not verified and this method will return 0 even if the event does not exist.
 * @param client the DB client returned from db.js connect
 * @param {Number} eventId the ID of the event to get registration information for
 */
function getTotalNumberOfRegistrations(client, eventId) {
    return client
        .query({
            name: 'registration_count_for_event',
            text: 'SELECT count(*) FROM Registrations WHERE event_id = $1::INTEGER',
            values: [eventId]
        })
        .then(function(result) {
            if (result.rowCount > 0) {
                return result.rows[0].count;
            } else {
                return 0;
            }
        });
}

/**
 * Gets the total number of attending registrations for the specified event. the event ID
 * is not verified and this method will return 0 even if the event does not exist.
 * @param client the DB client returned from db.js connect
 * @param {Number} eventId the ID of the event to get registration information for
 * @returns {Promise<Number>}
 */
function getTotalNumberOfAttendingRegistrations(client, eventId) {
    return client
        .query({
            name: 'attending_registration_count_for_event',
            text: 'SELECT count(*) FROM Registrations WHERE event_id = $1::INTEGER AND attending = true',
            values: [eventId]
        })
        .then(function(result) {
            if (result.rowCount > 0) {
                return result.rows[0].count;
            } else {
                return 0;
            }
        });
}

/**
 * Gets the first item in the rows of the query result or returns undefined if the
 * rowCount is 0.
 * @param {{rowCount: number, rows:*[]}} queryResult the query results returned from
 * @returns {*} the first value in the array or undefined. 
 */
function firstRowOrUndefined(queryResult) {
    if (queryResult.rowCount > 0) {
        return queryResult.rows[0];
    } else {
        return undefined;
    }
}

function createRegistrationsArrayFromQueryResult(result) {
    return result.rows.map((row) => {
        let user;

        if (row.user_id) {
            // TODO: change to create user models only once
            user = new UserModel({
                id: row.user_id,
                firstName: row.user_first_name,
                lastName: row.user_last_name
            });
        }

        return {
            id: row.registrations_id,
            eventId: row.event_id,
            user: user,
            attending: row.attending
        };
    });
}

module.exports = {

    createRegistration(eventId, userId, contextUserId, attending) {
        return db.query('INSERT INTO Registrations (event_id, user_id, created_by, attending) VALUES ($1::INTEGER, $2::INTEGER, $3::INTEGER, $4::BOOLEAN) RETURNING registrations_id', [eventId, userId, contextUserId, attending])
            .then((result) => {
                if (result.rowCount > 0) {
                    return result.rows[0].registrations_id;
                } else {
                    return undefined;
                }
            });
    },

    /**
     * Gets the total number of attending registrations for the specified event. The event ID
     * is not verified and this method will return 0 even if the event does not exist.
     * @param {Number} eventId the ID of the event to get registration information for
     * @returns {Promise<Number>}
     */
    getTotalNumberOfRegistrations(eventId) {
        return db.query({
                name: 'registration_count_for_event',
                text: 'SELECT count(*) FROM Registrations WHERE event_id = $1::INTEGER',
                values: [eventId]
            })
            .then(function(result) {
                if (result.rowCount > 0) {
                    return result.rows[0].count;
                } else {
                    return 0;
                }
            });
    },

    /**
     * Gets a page of registrations for an event.
     * @param {Number} contextUserId ID of the user that this view should be built for
     * @param {Number} eventId ID of the event to load registrations for
     * @param {Number} [limit=20] the maximum number of registrations to load
     * @param {Number} [offset=0] the number of elements to skip before starting to add registrations 
     * @returns {Promise<RegistrationQueryResult>}
     */
    findRegistrationsForEvent(contextUserId, eventId, limit, offset) {
        var client;

        offset = offset || 0;
        if (!_.isNumber(offset) || !_.isFinite(offset) || offset == NaN) {
            throw new Error('Offset value is not a valid number. \nactual:' + offset);
        }
        if (offset < 0) {
            throw new Error('Offset must not be negative. \nactual: ' + offset);
        }

        limit = limit || 20;
        if (!_.isNumber(limit) || !_.isFinite(limit) || limit == NaN) {
            throw new Error('Limit value is not a valid number. \nactual: ' + limit);
        }
        if (limit <= 0) {
            throw new Error('Limit must be greater than 1. \nactual: ' + limit);
        }

        return db.connect()
            .then(function(c) {
                client = c;
                return c;
            })
            .then(function(client) {
                return getTotalNumberOfRegistrations(client, eventId);
            })
            .then(function(totalRegistrations) {
                return client.query({
                        name: 'registration_find_for_event',
                        text: `SELECT
                            r.registrations_id,
                            r.event_id,
                            r.user_id,
                            r.created,
                            r.created_by createdBy,
                            r.attending,
                            u.first_name user_first_name,
                            u.last_name user_last_name
                            FROM Registrations r
                            JOIN Users u ON r.user_id = u.users_id
                            WHERE r.event_id = $1::INTEGER
                            ORDER BY r.created, r.registrations_id 
                            LIMIT 100 
                            OFFSET ${offset}`,
                        values: [eventId]
                    })
                    .then(createRegistrationsArrayFromQueryResult)
                    .then((registrations) => new RegistrationQueryResult(registrations, totalRegistrations));
            })
            .fin(function() {
                if (client) {
                    client.done();
                }
            });
    },

    /**
     * Gets a page of registrations for an event that are all attending.
     * @param {Number} contextUserId ID of the user that this view should be built for
     * @param {Number} eventId ID of the event to load registrations for
     * @returns {Promise<RegistrationQueryResult>}
     */
    findAttendingRegistrationsForEvent: function(contextUserId, eventId) {
        var client;

        return db.connect()
            .then((c) => {
                client = c;
                return c;
            })
            .then((client) => {
                return getTotalNumberOfAttendingRegistrations(client, eventId);
            })
            .then(function(totalRegistrations) {
                return client.query({
                        name: 'attending_registration_find_for_event',
                        text: `SELECT
                            r.registrations_id,
                            r.event_id,
                            r.user_id,
                            r.created,
                            r.created_by createdBy,
                            r.attending,
                            u.first_name user_first_name,
                            u.last_name user_last_name
                            FROM Registrations r
                            JOIN Users u ON r.user_id = u.users_id
                            WHERE r.event_id = $1::INTEGER
                            AND r.attending = true
                            ORDER BY r.created, r.registrations_id 
                            LIMIT 100`,
                        values: [eventId]
                    })
                    .then(createRegistrationsArrayFromQueryResult)
                    .then(function(registrations) {
                        return new RegistrationQueryResult(registrations, totalRegistrations);
                    });
            })
            .fin(function() {
                if (client) {
                    client.done();
                }
            });
    },

    /**
     * Gets the registration for a user at the specified event. If the user doesn't have a
     * registration, then undefined is returned.
     * @param {Number} eventId ID of the event to load the registration for
     * @param {Number} userId ID of the user to load the registration for
     * @returns {Promise<Object>}
     */
    findRegistrationByEventIdAndUserId: function(eventId, userId) {
        return db.query({
                name: 'registration_find_for_event_and_user',
                text: `SELECT
                    registrations_id id,
                    event_id eventId,
                    user_id userId,
                    created,
                    created_by createdBy,
                    attending
                    FROM Registrations
                    WHERE
                    event_id = $1::INTEGER AND
                    user_id = $2::INTEGER`, 
                values: [eventId, userId]
            })
            .then(firstRowOrUndefined);
    },

    /**
     * Gets the registration with the specified ID. If the registration doesn't exist, then 
     * undefined is returned.
     * @param {Number} registrationId ID of the registration to load
     * @returns {Promise<Object>}
     */
    findRegistrationById: function(registrationId) {
        return db.query({
                name: 'registration_find_by_id',
                text: `SELECT
                    registrations_id id,
                    event_id eventId,
                    user_id userId,
                    created,
                    created_by createdBy,
                    attending
                    FROM Registrations
                    WHERE registrations_id = $1::INTEGER`,
                values: [registrationId]
            })
            .then(firstRowOrUndefined);
    },

    /**
     * Updates the attending property of the registration to the specified value
     * @param {Number} registrationId ID of the registration to update
     * @param {Boolean} attending value to update the property to
     * @returns {Promise<Object>}
     */
    updateAttending(registrationId, attending) {
        return db.query(`UPDATE Registrations
                SET attending = $2::BOOLEAN
                WHERE registrations_id = $1::INTEGER
                RETURNING registrations_id`, [registrationId, attending])
            .then(firstRowOrUndefined);
    }
};