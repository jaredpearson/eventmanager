'use strict';

var db = require('../db'),
    Q = require('q'),
    moment = require('moment'),
    util = require('../util'),
    EventModel = require('../models/event'),
    UserModel = require('../models/user');

var findByIdSql =       'SELECT e.events_id, ' +
                        'e.event_name, ' +
                        'e.owner, ' +
                        'ou.first_name owner_first_name, ' +
                        'ou.last_name owner_last_name, ' +
                        'e.start, ' +
                        'e.description, ' +
                        'e.created, ' +
                        'e.created_by, ' +
                        'cu.first_name created_by_first_name, ' +
                        'cu.last_name created_by_last_name, ' +
                        'r.registrations_id, ' +
                        'r.attending ' +
                        'FROM Events e ' +
                        'LEFT OUTER JOIN Users ou ON e.owner = ou.users_id ' +
                        'LEFT OUTER JOIN Users cu ON e.created_by = cu.users_id ' +
                        'LEFT OUTER JOIN (SELECT r.* FROM Registrations r WHERE r.user_id = $1::INTEGER) r ON e.events_id = r.event_id ' +
                        'WHERE e.events_id = $2::INTEGER ' + 
                        'LIMIT 1'; 

var top10NewestSql =    'SELECT e.events_id, ' +
                        'e.event_name, ' +
                        'e.owner, ' +
                        'ou.first_name owner_first_name, ' +
                        'ou.last_name owner_last_name, ' +
                        'e.start, ' +
                        'e.description, ' +
                        'e.created, ' +
                        'e.created_by, ' +
                        'cu.first_name created_by_first_name, ' +
                        'cu.last_name created_by_last_name, ' +
                        'r.registrations_id, ' +
                        'r.attending ' +
                        'FROM (SELECT e.* FROM Events e ORDER BY e.created DESC, e.events_id LIMIT 10) e ' +
                        'LEFT OUTER JOIN Users ou ON e.owner = ou.users_id ' +
                        'LEFT OUTER JOIN Users cu ON e.created_by = cu.users_id ' +
                        'LEFT OUTER JOIN (SELECT r.* FROM Registrations r WHERE r.user_id = $1::INTEGER) r ON e.events_id = r.event_id ' +
                        'ORDER BY e.created DESC, e.events_id ' +
                        'LIMIT 10';

function UserCache() {
    this.usersById = {};
}
UserCache.prototype.findById = function(id) {
    return this.usersById[id];
}
UserCache.prototype.put = function(id, user) {
    if (id && user) {
        this.usersById[id] = new UserModel(user);
    }
}
UserCache.prototype.getOrPut = function(id, user) {
    var found = this.findById(id);
    if (found) {
        return found;
    } else {
        this.put(id, user);
        return user;
    }
}

function eventQueryResultToEventArray(results) {
    var events = [],
        userCache = new UserCache();

    // transform the row in to a hierarchy of objects
    results.rows.forEach(function(eventData) {
        var event = eventQueryRowToEvent(eventData, userCache);
        events.push(event);
    });

    return Q(events);
}

function eventQueryRowToEvent(eventData, userCache) {
    var ownerUser,
        createdByUser,
        myRegistration;

    if (eventData.owner) {
        ownerUser = userCache.getOrPut(eventData.owner, {
            id: eventData.owner,
            firstName: eventData.owner_first_name,
            lastName: eventData.owner_last_name
        });
    }

    if (eventData.created_by) {
        createdByUser = userCache.getOrPut(eventData.created_by, {
            id: eventData.created_by,
            firstName: eventData.created_by_first_name,
            lastName: eventData.created_by_last_name
        });
    }

    if (eventData.registrations_id) {
        myRegistration = {
            id: eventData.registrations_id,
            attending: eventData.attending
        };
    }

    return new EventModel({
        id: eventData.events_id,
        name: eventData.event_name,
        owner: ownerUser,
        start: moment(eventData.start),
        description: eventData.description,
        created: moment(eventData.created),
        createdBy: createdByUser,
        myRegistration: myRegistration
    });
}

module.exports = {
    getNameMaxLength: function() {
        return 50;
    },

    getDescriptionMaxLength: function() {
        return 500;
    },

    createEvent: function(name, description, start, createdBy) {
        var client;
        return db.connect()
            .then(function(c) {
                client = c;
                return Q(c);
            })
            .then(function() {
                return client.query({
                    name: 'event_insert',
                    text: 'INSERT INTO Events (event_name, description, start, created_by, owner) VALUES ($1::TEXT, $2::TEXT, to_timestamp($3::BIGINT), $4::INTEGER, $5::INTEGER) RETURNING events_id',
                    values: [name, description, start.unix(), createdBy, createdBy]
                });
            })
            .then(function(result) {
                if (result.rowCount > 0) {
                    return Q(result.rows[0].events_id);
                } else {
                    return Q(undefined);
                }
            })
            .fin(function() {
                client.done();
            });
    },

    getNewestEvents: function(contextUserId) {
        var client;

        return db.connect()
            .then(function(c) {
                client = c;
                return Q(c);
            })
            .then(function() {
                return client.query({
                    name: 'event_top_10',
                    text: top10NewestSql,
                    values: [contextUserId]
                });
            })
            .then(function(results) {
                return eventQueryResultToEventArray(results);
            })
            .fin(function() {
                client.done();
            });
    },

    findEventById: function(contextUserId, eventId) {
        var client;

        if (!util.isInt(eventId)) {
            return Q.reject('Invalid event ID. An event ID is a number');
        }

        return db.connect()
            .then(function(c) {
                client = c;
                return Q(c);
            })
            .then(function() {
                return client.query({
                    name: 'event_find_by_id',
                    text: findByIdSql,
                    values: [contextUserId, eventId]
                });
            })
            .then(function(results) {
                return eventQueryResultToEventArray(results);
            })
            .then(function(events) {
                if (events && events.length > 0) {
                    return Q(events[0]);
                } else {
                    return Q(undefined);
                }
            })
            .fin(function() {
                client.done();
            });
    }
};