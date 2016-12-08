'use strict';

/**
 * Service for events that contains higher order functions for working with events.
 * Use the modules from "data_sources" (like "data_sources/event") for lower level 
 * functions.
 * @module
 */

const eventsDataSource = require('../data_sources/events');
const registrationsDataSource = require('../data_sources/registration');
const q = require('q');

// TODO assume the user's timezone is PST
const timezone = 'America/Los_Angeles';

class EventAndRegistrationsModel {
    constructor(eventData, attendingQueryResult, registrationQueryResult) {
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
        return q.spread([eventPromise, attendingRegistrationsPromise, registrationsPromise], 
            (event, attendingRegistrations, registrations) => {
                if (!event) {
                    return undefined;
                }
                
                return new EventAndRegistrationsModel(
                    event,
                    attendingRegistrations,
                    registrations);
            });
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