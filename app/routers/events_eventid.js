'use strict';

var router = require('express').Router(),
    auth = require('../middlewares/auth'),
    util = require('../util'),
    Q = require('q'),
    eventsDataSource = require('../data_sources/events'),
    registrationsDataSource = require('../data_sources/registration');

function EventViewModel(event, registrations) {
    this.event = event;
    this.myRegistration = event.myRegistration;
    this.hasRegistration = typeof event.myRegistration !== 'undefined';
    this.registrations = (registrations) ? registrations.registrations : [];
    this.totalRegistrations = (registrations) ? registrations.totalCount : 0;
    this.hasMoreRegistrations = registrations && registrations.hasMoreRegistrations;
}

router.get('/events/:eventId', auth, function(req, res) {
    var eventId = req.params.eventId;
    if (!eventId || !util.isInt(eventId)) {
        res.sendStatus(404);
        return;
    }
    var contextUserId = req.session.user_id;
    var event;
    var registrations;

    eventsDataSource.findEventById(contextUserId, eventId)
        .then(function(foundEvent) {
            event = foundEvent;
            return Q(foundEvent);
        })
        .then(function(event) {
            if (event) {
                return registrationsDataSource.findAttendingRegistrationsForEvent(contextUserId, event.id);
            } else {
                return Q(undefined);
            }
        })
        .then(function(foundRegistrations) {
            registrations = foundRegistrations;
            return Q(foundRegistrations);
        })
        .then(function() {
            if (event) {
                res.render('pages/event_view', new EventViewModel(event, registrations));
            } else {
                res.sendStatus(404);
            }
        })
        .fail(function(err) {
            console.error(err);
            res.render('pages/unexpected_error');
        })
        .done();
});

module.exports.router = router;