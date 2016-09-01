'use strict';

const router = require('express').Router();
const auth = require('../middlewares/auth');
const util = require('../util');
const Q = require('q');
const _ = require('underscore');
const eventsDataSource = require('../data_sources/events');
const registrationsDataSource = require('../data_sources/registration');
const ui = require('../ui');

function buildPagination(urlBuilderFn, total, size, offset) {
    var action;
    var actions = [];
    var index = 0;
    var activeIndex = -1;
    for (let i = 0; i < total; i = i + size) {
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

function createRegistrationPageUrlBuilder(eventId) {
    return (i, total, size, offset) => {
        offset = offset || 0;
        return '/events/' + eventId + '/registrations?offset=' + offset;
    };
}

router.get('/events/:eventId/registrations', auth(), function(req, res) {
    var eventId = req.params.eventId;
    if (!eventId || !util.isInt(eventId)) {
        res.sendStatus(404);
        return;
    }
    var contextUserId = req.session.user_id;
    var registrationsPerPage = 100;
    var offset = parseInt(req.query.offset, 10) || 0;

    // if offset is not correct, just continue with 0
    if (!_.isNumber(offset) || !_.isFinite(offset) || offset < 0) {
        offset = 0;
    }

    eventsDataSource.findEventById(contextUserId, eventId)
        .then((eventData) => {
            if (!eventData) {
                return undefined;
            }

            return registrationsDataSource.findRegistrationsForEvent(contextUserId, eventData.id, registrationsPerPage, offset)
                .then((registrationsQueryResult) => ({
                    event: eventData,
                    registrationsQueryResult: registrationsQueryResult
                }));
        })
        .then((eventAndRegistrations) => {
            if (!eventAndRegistrations) {
                return res.sendStatus(404);
            }

            const event = eventAndRegistrations.event;
            const registrationsQueryResult = eventAndRegistrations.registrationsQueryResult;
            const totalRegistrations = registrationsQueryResult ? registrationsQueryResult.total : 0;

            const pagination = buildPagination(
                createRegistrationPageUrlBuilder(event.id),
                totalRegistrations,
                registrationsPerPage,
                offset);

            res.render('pages/event_registrations', {
                event: event, 
                registrations: registrationsQueryResult ? registrationsQueryResult.items : [],
                totalRegistrations: totalRegistrations,
                pagination: pagination
            });
        })
        .fail((err) => ui.showErrorPage(res, err))
        .done();
});

module.exports.router = router;