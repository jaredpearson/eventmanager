'use strict';

/**
 * Service for events that contains higher order functions for working with events.
 * Use the modules from "data_sources" (like "data_sources/event") for lower level 
 * functions.
 * @module
 */

const eventsDataSource = require('../data_sources/events');
const registrationsDataSource = require('../data_sources/registration');

class EventAndRegistrationsModel {
    constructor(event, attending) {
        this.event = event;
        this.myRegistration = event.myRegistration;
        this.hasRegistration = typeof event.myRegistration !== 'undefined';
        this.attending = (attending) ? attending.registrations : [];
        this.totalRegistrations = (attending) ? attending.totalCount : 0;
        this.hasMoreRegistrations = attending && attending.hasMoreRegistrations;
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
        return eventsDataSource.findEventById(contextUserId, eventId)
            .then((event) => {
                if (event) {
                    return registrationsDataSource.findAttendingRegistrationsForEvent(contextUserId, event.id)
                        .then((attending) => ({
                            event: event,
                            attending: attending
                        }));
                } else {
                    return undefined;
                }
            })
            .then((eventAndRegistrations) => {
                if (eventAndRegistrations) {
                    return new EventAndRegistrationsModel(eventAndRegistrations.event, eventAndRegistrations.attending)
                } else {
                    return undefined;
                }
            });
    }

};