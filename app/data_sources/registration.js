'use strict';

var Q = require('q'),
    db = require('../db');

module.exports = {

    createRegistration: function(eventId, userId, contextUserId, attending) {
        var client;
        return db.connect()
            .then(function(c) {
                client = c;
                return Q(c);
            })
            .then(function() {
                return client.query('INSERT INTO Registrations (event_id, user_id, created_by, attending) VALUES ($1::INTEGER, $2::INTEGER, $3::INTEGER, $4::BOOLEAN) RETURNING registrations_id', [eventId, userId, contextUserId, attending]);
            })
            .then(function(result) {
                if (result.rowCount > 0) {
                    return Q(result.rows[0].registrations_id);
                } else {
                    return Q(undefined);
                }
            })
            .fin(function() {
                client.done();
            });
    },

    findRegistrationByEventIdAndUserId: function(eventId, userId) {
        var client;
        return db.connect()
            .then(function(c) {
                client = c;
                return Q(c);
            })
            .then(function() {
                return client.query('SELECT registrations_id id, event_id eventId, user_id userId, created, created_by createdBy, attending FROM Registrations WHERE event_id = $1::INTEGER AND user_id = $2::INTEGER', [eventId, userId])
            })
            .then(function(result) {
                if (result.rowCount > 0) {
                    return Q(result.rows[0]);
                } else {
                    return Q(undefined);
                }
            })
            .fin(function() {
                client.done();
            });
    },

    findRegistrationById: function(registrationId) {
        var client;
        return db.connect()
            .then(function(c) {
                client = c;
                return Q(c);
            })
            .then(function() {
                return client.query('SELECT registrations_id id, event_id eventId, user_id userId, created, created_by createdBy, attending FROM Registrations WHERE registrations_id = $1::INTEGER', [registrationId])
            })
            .then(function(result) {
                if (result.rowCount > 0) {
                    return Q(result.rows[0]);
                } else {
                    return Q(undefined);
                }
            })
            .fin(function() {
                client.done();
            });
    }

};