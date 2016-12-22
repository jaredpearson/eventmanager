'use strict';

/**
 * Service for events that contains higher order functions for working with events.
 * Use the modules from "data_sources" (like "data_sources/event") for lower level 
 * functions.
 * @module
 */

const eventsDataSource = require('../data_sources/events');
const registrationsDataSource = require('../data_sources/registration');
const eventFeedItemsDataSource = require('../data_sources/eventFeedItems');
const q = require('q');
const db = require('../db');
const UserModel = require('../models/user');
const moment = require('moment-timezone');
const log = require('../log');
const ui = require('../ui');

// TODO assume the user's timezone is PST
const timezone = 'America/Los_Angeles';

class EventAndRegistrationsModel {
    constructor(eventData, attendingQueryResult, registrationQueryResult, feedItemPage) {
        this.id = eventData.id;
        this.name = eventData.name;
        this.descriptionHtml = eventData.descriptionHtml;

        const startTz = eventData.start.tz(timezone);
        this.start = startTz;
        this.startDateFormatted = startTz.format('ddd MMM D');   // Tues Sep 8
        this.startFullDateFormatted = startTz.format('dddd, MMMM D, YYYY'); // Tuesday, September 8, 2015
        this.startTimeFormatted = startTz.format('H:mm A z');    // 10:33 AM PST

        if (attendingQueryResult) {
            this.attendees = attendingQueryResult.items.map((registration) => {
                return {
                    name: registration.user.name
                };
            });
        } else {
            this.attendees = [];
        }

        if (eventData.myRegistration) {
            this.myRegistration = {
                id: eventData.myRegistration.id,
                attending: eventData.myRegistration.attending
            }
        } else {
            this.myRegistration = null;
        }

        this.registrations = {
            total: registrationQueryResult.total,
            items: registrationQueryResult.items
        };

        this.feedItems = feedItemPage;
    }
}

class EventModel {
    constructor(eventData) {
        this.id = eventData.id;
        this.name = eventData.name;

        const startTz = eventData.start.tz(timezone);
        this.start = startTz;
        this.startDateFormatted = startTz.format('ddd MMM D');   // Tues Sep 8
        this.startFullDateFormatted = startTz.format('dddd, MMMM D, YYYY'); // Tuesday, September 8, 2015
        this.startTimeFormatted = startTz.format('H:mm A z');    // 10:33 AM PST
    }
}

/**
 * Finds the first page of feed items for the specified event 
 */
function findFeedItemPageForEvent(eventPromise) {
    log.debug('findFeedItemPageForEvent');
    return eventPromise.then((event) => {
        if (!event) {
            return undefined;
        }
        log.debug('findFeedItemPageForEvent db.connect');
        const clientPromise = db.connect();
            
        const feedItemPromise = clientPromise.then((client) => {
            log.debug('query for event feed items');
            return client.query({
                name: 'event_feed_item_page',
                text: `SELECT
                    fi.event_feed_item_id "eventFeedItemId",
                    fi.events_id "eventId",
                    fi.item_text "itemText",
                    fi.created created,
                    fi.created_by "createdBy",
                    cu.first_name "createdBy_firstName",
                    cu.last_name "createdBy_lastName"
                    FROM EventFeedItems fi
                    LEFT OUTER JOIN Users cu ON fi.created_by = cu.users_id
                    WHERE fi.events_id=$1::INTEGER
                    ORDER BY created desc
                    LIMIT 20`,
                values: [event.id]
            });
        });
        
        const feedItemCountPromise = clientPromise.then((client) => {
            log.debug('query for event feed item count');
            return client.query({
                    name: 'event_feed_item_count',
                    text: `SELECT count(*)
                        FROM EventFeedItems
                        WHERE events_id=$1::INTEGER`,
                    values: [event.id]
                })
                .then((result) => {
                    if (result.rowCount > 0) {
                        return result.rows[0].count;
                    } else {
                        return 0;
                    }
                });
        });

        const usersPromise = feedItemPromise.then((queryResults) => {
                // normalize all of the user objects into a set of users
                const userIdMap = queryResults.rows.reduce((userIdMap, row) => {
                    if (typeof row.createdBy != 'undefined' && !userIdMap.has(row.createdBy)) {
                        userIdMap.set(row.createdBy, new UserModel({
                            id: row.createdBy,
                            firstName: row.createdBy_firstName,
                            lastName: row.createdBy_lastName
                        }));
                    }
                    return userIdMap;
                }, new Map());

                return userIdMap;
            });

        return q.spread([feedItemPromise, usersPromise, feedItemCountPromise], 
            (feedItemsQuery, userIdToUserMap, total) => {
                log.debug('build event feed item page representation');
                const items = feedItemsQuery.rows.map((row) => {
                    const created = moment.tz(row.created, 'Etc/GMT+0');
                    const createdTz = created.tz(timezone);
                    const createdDateFormatted = createdTz.format('ddd MMM D');   // Tues Sep 8
                    const createdFullDateFormatted = createdTz.format('dddd, MMMM D, YYYY'); // Tuesday, September 8, 2015
                    const createdTimeFormatted = createdTz.format('H:mm A z');    // 10:33 AM PST

                    // create the feed item to be returned to the user
                    return {
                        id: row.eventFeedItemId,
                        eventId: row.eventId,
                        text: row.itemText,
                        textHtml: ui.formatAsHtml(row.itemText),
                        created: created,
                        createdDateFormatted: createdDateFormatted,
                        createdFullDateFormatted: createdFullDateFormatted,
                        createdTimeFormatted: createdTimeFormatted,
                        createdBy: userIdToUserMap.get(row.createdBy)
                    };
                });

                return {total, items};
            })
            .fin(() => {
                clientPromise.then((client) => client.done());
            });
    });
}

module.exports = {

    /**
     * Finds the event corresponding to the event ID for view by the specified user ID. This
     * method also loads up the registrations associated.
     * 
     * @param {Number} contextUserId
     * @param {Number} eventId
     * @returns {EventAndRegistrationsModel}
     */
    findEventAndRegistrations(contextUserId, eventId) {

        const eventPromise = eventsDataSource.findEventById(contextUserId, eventId);
        const attendingRegistrationsPromise = eventPromise
            .then((event) => {
                if (!event) {
                    return undefined;
                }

                return registrationsDataSource.findAttendingRegistrationsForEvent(contextUserId, event.id);
            });
        const registrationsPromise = eventPromise
            .then((event) => {
                if (!event) {
                    return undefined;
                }

                return registrationsDataSource.findRegistrationsForEvent(contextUserId, event.id);
            });
        const feedItemPagePromise = findFeedItemPageForEvent(eventPromise);

        return q.spread([eventPromise, attendingRegistrationsPromise, registrationsPromise, feedItemPagePromise], 
            (event, attendingRegistrations, registrations, feedItemPage) => {
                if (!event) {
                    return undefined;
                }
                
                return new EventAndRegistrationsModel(
                    event,
                    attendingRegistrations,
                    registrations,
                    feedItemPage);
            });
    },

    /**
     * Creates a new EventFeedItem and returns the ID of the new row
     * @param {String} text
     * @param {Number} eventId
     * @param {Number} createdBy
     * @returns {Promise<Number>}
     */
    createFeedItem(text, eventId, createdBy) {
        return eventFeedItemsDataSource.createFeedItem(text, eventId, createdBy);
    },

    /**
     * Gets a list of upcoming events
     * 
     * @param {Number} contextUserId
     */
    getUpcomingEvents(contextUserId) {
        return eventsDataSource.getUpcomingEvents(contextUserId)
            .then((events) => events.map((eventData) => new EventModel(eventData)));
    }

};