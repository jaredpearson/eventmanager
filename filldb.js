'use strict';

var db = require('./app/db.js');
var Q = require('q');
var client;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getTime() {
    var t = process.hrtime();
    return (t[0] * 1000000000 + t[1]);
}

function insertRegistration(client, eventId, userId) {
    return client.query({
            name: 'insert_registration',
            text: 'INSERT INTO Registrations (event_id, user_id, created_by) VALUES ($1::INTEGER, $2::INTEGER, $3::INTEGER) RETURNING registrations_id',
            values: [eventId, userId, userId]
        })
        .then(function(result) {
            return Q(result.rows[0].registrations_id);
        });
}

function insertUser(client, username) {
    return client.query({
            name: 'insert_user',
            text: 'INSERT INTO Users (username) VALUES ($1::TEXT) RETURNING users_id',
            values: [username]
        })
        .then(function(result) {
            return Q(result.rows[0].users_id);
        });
}

function insertUsersAndRegistrations(client, eventId) {
    var promises = [];
    var i = -1;
    var p;

    for (i = 0; i < 1000; i++) {
        p = (function() {
            var thisIndex = i;
            return function() {
                    var username = 'user' + getTime();
                    var userId;
                    return insertUser(client, username)
                        .then(function(id) {
                            userId = id;
                            return Q(id);
                        })
                        .then(function(userId) {
                            return insertRegistration(client, eventId, userId);
                        })
                        .then(function(registrationId) {
                            console.log('Inserted registration ' + registrationId + ' for user ' + userId);
                        });
                };
        })();
        promises.push(p);
    }

    return promises.reduce(function(soFar, f) {
        return soFar.then(f);
    }, Q(true));
}

function insertEvent(client, eventName, ownerId, start) {
    return client.query({
            name: 'insert_event',
            text: 'INSERT INTO Events (event_name, owner, start, created_by) VALUES ($1::TEXT, $2::INTEGER, to_timestamp($3::BIGINT), $4::INTEGER) RETURNING events_id',
            values: [eventName, ownerId, Math.floor(start.getTime() / 1000), ownerId]
        })
        .then(function(result) {
            return Q(result.rows[0].events_id);
        })
}

function addDays(date, value) {
    var result = new Date(date);
    result.setDate(result.getDate() + value);
    return result;
}

function insertEvents(client, ownerId) {
    var promises = [];
    var i = -1;
    var p;

    for (i = 0; i < 100; i++) {
        p = (function() {
            var thisIndex = i;
            return function() {
                    var eventName = 'event' + getTime();
                    var time = addDays(new Date(), thisIndex);

                    return insertEvent(client, eventName, ownerId, time)
                        .then(function(eventId) {
                            console.log('Inserted event ' + eventId);
                        });
                };
        })();
        promises.push(p);
    }

    return promises.reduce(function(soFar, f) {
        return soFar.then(f);
    }, Q(true));
}

db.connect()
    .then(function(c) {
        client = c;
        return Q(c);
    })
    .then(function() {
        return client.query('BEGIN');
    })
    .then(function() {
        return insertEvents(client, 2187);
    })
    .then(function() {
        return client.query('COMMIT');
    })
    .then(function() {
        console.log('finished');
    })
    .fin(function() {
        client.done();
    })
    .done();