'use strict';

const db = require('../db');
const moment = require('moment-timezone');
const util = require('../util');
const EventModel = require('../models/event');
const UserModel = require('../models/user');
const Q = require('q');

const findByIdSql =     `SELECT e.events_id,
                         e.event_name,
                         e.owner,
                         ou.first_name owner_first_name,
                         ou.last_name owner_last_name,
                         e.start,
                         e.description,
                         e.created,
                         e.created_by,
                         cu.first_name created_by_first_name,
                         cu.last_name created_by_last_name,
                         r.registrations_id,
                         r.attending
                         FROM Events e
                         LEFT OUTER JOIN Users ou ON e.owner = ou.users_id
                         LEFT OUTER JOIN Users cu ON e.created_by = cu.users_id
                         LEFT OUTER JOIN (SELECT r.* FROM Registrations r WHERE r.user_id = $1::INTEGER) r ON e.events_id = r.event_id
                         WHERE e.events_id = $2::INTEGER 
                         LIMIT 1`; 

const top10UpcomingSql =  `SELECT e.events_id,
                         e.event_name,
                         e.owner,
                         ou.first_name owner_first_name,
                         ou.last_name owner_last_name,
                         e.start,
                         e.description,
                         e.created,
                         e.created_by,
                         cu.first_name created_by_first_name,
                         cu.last_name created_by_last_name,
                         r.registrations_id,
                         r.attending
                         FROM (SELECT e.* FROM Events e ORDER BY e.start ASC, e.events_id) e
                         LEFT OUTER JOIN Users ou ON e.owner = ou.users_id
                         LEFT OUTER JOIN Users cu ON e.created_by = cu.users_id
                         LEFT OUTER JOIN (SELECT r.* FROM Registrations r WHERE r.user_id = $1::INTEGER) r ON e.events_id = r.event_id
                         WHERE e.start >= CURRENT_TIMESTAMP
                         ORDER BY e.start ASC, e.events_id
                         LIMIT 10`;

class UserCache {
    constructor() {
        this.usersById = {};
    }
    findById(id) {
        return this.usersById[id];
    }
    put(id, user) {
        if (id && user) {
            this.usersById[id] = new UserModel(user);
        }
    }
    getOrPut(id, user) {
        var found = this.findById(id);
        if (found) {
            return found;
        } else {
            this.put(id, user);
            return user;
        }
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

    return events;
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
    
    // TODO assume the user's timezone is PST
    const timezone = 'America/Los_Angeles';

    return new EventModel({
        id: eventData.events_id,
        name: eventData.event_name,
        owner: ownerUser,
        start: moment.tz(eventData.start, 'Etc/GMT+0').tz(timezone),
        description: eventData.description,
        created: moment.tz(eventData.created, 'Etc/GMT+0').tz(timezone),
        createdBy: createdByUser,
        myRegistration: myRegistration
    });
}

/**
 * Converts a moment date into a GMT string that can be passed to the 
 * database.
 */
function convertDateToGmtString(value) {
    if (!value) {
        return value;
    }
    const valueGmt = value ? moment(value).tz('Etc/GMT+0') : null;
    return valueGmt ? valueGmt.format('YYYY-MM-DDTHH:mm:ss') : null;
}

module.exports = {
    getNameMaxLength: () => 50,

    getDescriptionMaxLength: () => 500,

    createEvent(name, description, start, createdBy) {
        const startGmtAsString = convertDateToGmtString(start);
        
        return db.query({
                name: 'event_insert',
                text: 'INSERT INTO Events (event_name, description, start, created_by, owner) VALUES ($1::TEXT, $2::TEXT, to_timestamp($3::TEXT,\'YYYY-MM-DD"T"HH24:MI:SS\'), $4::INTEGER, $5::INTEGER) RETURNING events_id',
                values: [name, description, startGmtAsString, createdBy, createdBy]
            })
            .then((result) => {
                if (result.rowCount > 0) {
                    return result.rows[0].events_id;
                } else {
                    return undefined;
                }
            });
    },

    getUpcomingEvents(contextUserId) {
        return db.query({
                name: 'event_top_10',
                text: top10UpcomingSql,
                values: [contextUserId]
            })
            .then((results) => {
                return eventQueryResultToEventArray(results);
            });
    },

    findEventById(contextUserId, eventId) {
        if (!util.isInt(eventId)) {
            return Q.reject('Invalid event ID. An event ID is a number');
        }

        return db.query({
                name: 'event_find_by_id',
                text: findByIdSql,
                values: [contextUserId, eventId]
            })
            .then((results) => {
                return eventQueryResultToEventArray(results);
            })
            .then((events) => {
                if (events && events.length > 0) {
                    return events[0];
                } else {
                    return undefined;
                }
            });
    }
};