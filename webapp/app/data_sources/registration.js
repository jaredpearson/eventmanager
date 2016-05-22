'use strict';

var db = require('../db'),
    UserModel = require('../models/user'),
    _ = require('underscore');

class RegistrationQueryResult {
    constructor(registrations, totalCount) {
        this.registrations = registrations;
        this.totalCount = totalCount;
        this.hasMoreRegistrations = this.registrations.length > totalCount;
    }
}

// gets the total number of registrations for the specified event. the event ID 
// is not verified and this method will return 0 even if the event does not exist.
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

function createRegistrationsArrayFromQueryResult(result) {
    return result.rows.map(function(row) {
        var user;

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

    findRegistrationsForEvent(contextUserId, eventId, limit, offset) {
        var client;
        var totalRegistrations;

        offset = offset || 0;
        if (!_.isNumber(offset) || !_.isFinite(offset) || offset == NaN) {
            throw new Error('Offset value is not a valid number. \nactual:' + offset);
        }
        if (offset < 0) {
            throw new Error('Offset must not be negative. \nactual: ' + offset);
        }

        limit = limit || 0;
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
            .then(function() {
                return getTotalNumberOfRegistrations(client, eventId);
            })
            .then(function(totalRegistrationsResult) {
                totalRegistrations = totalRegistrationsResult;
                return totalRegistrations;
            })
            .then(function() {
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
                });
            })
            .then(function(result) {
                return createRegistrationsArrayFromQueryResult(result);
            })
            .then(function(registrations) {
                return new RegistrationQueryResult(registrations, totalRegistrations);
            })
            .fin(function() {
                if (client) {
                    client.done();
                }
            });
    },

    findAttendingRegistrationsForEvent: function(contextUserId, eventId) {
        var client;
        var totalRegistrations;

        return db.connect()
            .then(function(c) {
                client = c;
                return c;
            })
            .then(function() {
                return getTotalNumberOfRegistrations(client, eventId);
            })
            .then(function(totalRegistrationsResult) {
                totalRegistrations = totalRegistrationsResult;
                return totalRegistrations;
            })
            .then(function() {
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
                          AND r.attending = true
                          ORDER BY r.created, r.registrations_id 
                          LIMIT 100`,
                    values: [eventId]
                });
            })
            .then(function(result) {
                return createRegistrationsArrayFromQueryResult(result);
            })
            .then(function(registrations) {
                return new RegistrationQueryResult(registrations, totalRegistrations);
            })
            .fin(function() {
                if (client) {
                    client.done();
                }
            });
    },

    findRegistrationByEventIdAndUserId: function(eventId, userId) {
        var client;
        return db.query('SELECT registrations_id id, event_id eventId, user_id userId, created, created_by createdBy, attending FROM Registrations WHERE event_id = $1::INTEGER AND user_id = $2::INTEGER', [eventId, userId])
            .then(function(result) {
                if (result.rowCount > 0) {
                    return result.rows[0];
                } else {
                    return undefined;
                }
            });
    },

    findRegistrationById: function(registrationId) {
        return db.query('SELECT registrations_id id, event_id eventId, user_id userId, created, created_by createdBy, attending FROM Registrations WHERE registrations_id = $1::INTEGER', [registrationId])
            .then(function(result) {
                if (result.rowCount > 0) {
                    return result.rows[0];
                } else {
                    return undefined;
                }
            });
    },

    updateAttending(registrationId, attending) {
        return db.query('UPDATE Registrations SET attending = $2::BOOLEAN WHERE registrations_id = $1::INTEGER RETURNING registrations_id', [registrationId, attending])
            .then((result) => {
                if (result.rowCount > 0) {
                    return result.rows[0];
                } else {
                    return undefined;
                }
            });
    }
};