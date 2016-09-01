'use strict';

const db = require('../db');
const moment = require('moment-timezone');
const util = require('../util');
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

function formatAsHtml(text) {
    if (!text) {
        return text;
    }

    var textAsHtml;

    // escape &, <, >, ", etc
    textAsHtml = _.escape(text);

    // turn line breaks into HTML line breaks
    textAsHtml = textAsHtml.replace(/\n/g, '<br />');

    return textAsHtml;
}

class EventModel {
    constructor(eventData) {
        this.id = eventData.id;
        this.name = eventData.name;
        this.start = eventData.start;
        this.description = eventData.description;
        this.descriptionHtml = formatAsHtml(eventData.description);
        this.myRegistration = eventData.myRegistration;
    }
}

/**
 * Simple in-memory cache so that users of the same ID can reuse the 
 * same objects
 */
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

    /**
     * Gets the value for the given ID from cache. If the value isn't in cache
     * yet, the object is stored at the specified ID and returned.
     * @param id the ID of the user
     * @param user the object to be stored in cache
     */
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

/**
 * Converts the query results from the findByIdSql query into an array of 
 * events.
 * @param {{rows: []}} results the results from executing the query
 * @returns {EventModel[]}
 */
function eventQueryResultToEventArray(results) {
    const userCache = new UserCache();

    // transform the row in to a hierarchy of objects
    const events = results.rows.map((eventData) => {
        return eventQueryRowToEvent(eventData, userCache);
    });

    return events;
}

/**
 * @param {Object} eventData the event information from the query row
 * @param {UserCache} userCache
 * @returns {EventModel} 
 */
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
        start: moment.tz(eventData.start, 'Etc/GMT+0'),
        description: eventData.description,
        created: moment.tz(eventData.created, 'Etc/GMT+0'),
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
            .then(eventQueryResultToEventArray);
    },

    /**
     * Finds the event with the specified ID within the context of the
     * given user.
     * @param {number} contextUserId The ID of the user to retrieve event info fo.
     * @param {number} eventId The ID of the event to retrieve.
     */
    findEventById(contextUserId, eventId) {
        if (!util.isInt(eventId)) {
            return Q.reject('Invalid event ID. An event ID is a number');
        }

        return db.query({
                name: 'event_find_by_id',
                text: findByIdSql,
                values: [contextUserId, eventId]
            })
            .then(eventQueryResultToEventArray)
            .then((events) => {
                if (events && events.length > 0) {
                    return events[0];
                } else {
                    return undefined;
                }
            });
    }
};