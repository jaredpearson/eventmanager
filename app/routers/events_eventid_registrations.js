'use strict';

var router = require('express').Router(),
    auth = require('../middlewares/auth'),
    util = require('../util'),
    Q = require('q'),
    _ = require('underscore'),
    eventsDataSource = require('../data_sources/events'),
    registrationsDataSource = require('../data_sources/registration');

function buildPagination(urlBuilderFn, total, size, offset) {
    var numberOfPages = Math.ceil(total / size);
    var isOnFirstPage = (offset < size);
    var isOnLastPage = (offset > total - size);

    var action;
    var actions = [];
    var index = 0;
    var activeIndex = -1;
    var i = -1;
    for (i = 0; i < total; i = i + size) {
        action = {
            offset: i,
            label: index + 1,
            active: offset >= i && offset < i + size,
            url: urlBuilderFn(i, total, size, offset)
        };

        if (action.active) {
            activeIndex = index;
        }

        actions.push(action);
        index++;
    }
    return {
        previousAction: (activeIndex > -1 && activeIndex - 1 >= 0) ? actions[activeIndex - 1] : undefined,
        nextAction: (activeIndex > -1 && activeIndex + 1 < actions.length) ? actions[activeIndex + 1] : undefined,
        actions: actions
    };
}

function createRegistrationPageUrl(eventId, offset) {
    offset = offset || 0;
    return '/events/' + eventId + '/registrations?offset=' + offset;
}

router.get('/events/:eventId/registrations', auth, function(req, res) {
    var eventId = req.params.eventId;
    if (!eventId || !util.isInt(eventId)) {
        res.sendStatus(404);
        return;
    }
    var contextUserId = req.session.user_id;
    var event;
    var registrations;
    var registrationsPerPage = 100;
    var offset = parseInt(req.query.offset, 10) || 0;

    // if offset is not correct, just continue with 0
    if (!_.isNumber(offset) || !_.isFinite(offset) || offset < 0) {
        offset = 0;
    }

    eventsDataSource.findEventById(contextUserId, eventId)
        .then(function(foundEvent) {
            event = foundEvent;
            return Q(foundEvent);
        })
        .then(function(event) {
            if (event) {
                return registrationsDataSource.findRegistrationsForEvent(contextUserId, event.id, registrationsPerPage, offset);
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
                var totalRegistrations = registrations ? registrations.totalCount : 0;
                var pagination = buildPagination(function(offset) {
                    return createRegistrationPageUrl(eventId, offset)
                }, totalRegistrations, registrationsPerPage, offset);

                res.render('pages/event_registrations', {
                    event: event, 
                    registrations: registrations ? registrations.registrations : [],
                    totalRegistrations: totalRegistrations,
                    pagination: pagination
                });
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