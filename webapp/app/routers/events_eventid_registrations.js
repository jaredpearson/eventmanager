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
    let actions = [];
    let index = 0;
    let activeIndex = -1;
    for (let i = 0; i < total; i = i + size) {
        let action = {
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
        actions
    };
}

function createRegistrationPageUrlBuilder(eventId) {
    return (i, total, size, offset) => {
        offset = offset || 0;
        return '/events/' + eventId + '/registrations?offset=' + offset;
    };
}

router.get('/events/:eventId/registrations', auth(), (req, res) => {
    const eventId = req.params.eventId;
    if (!eventId || !util.isInt(eventId)) {
        res.sendStatus(404);
        return;
    }
    const contextUserId = req.session.user_id;
    const registrationsPerPage = 100;

    // if offset is not correct, just continue with 0
    let offset = parseInt(req.query.offset, 10) || 0;
    if (!_.isNumber(offset) || !_.isFinite(offset) || offset < 0) {
        offset = 0;
    }

    const eventPromise = eventsDataSource.findEventById(contextUserId, eventId);
    const registrationsPromise = eventPromise.then(eventData => {
            if (!eventData) {
                return undefined;
            }
            return registrationsDataSource.findRegistrationsForEvent(contextUserId, eventData.id, registrationsPerPage, offset);
        });

    return Q.spread([eventPromise, registrationsPromise], (event, registrationsQueryResult) => {
            if (!event) {
                return res.sendStatus(404);
            }

            const totalRegistrations = registrationsQueryResult ? registrationsQueryResult.total : 0;

            const pagination = buildPagination(
                createRegistrationPageUrlBuilder(event.id),
                totalRegistrations,
                registrationsPerPage,
                offset);

            ui.renderStandard(req, res, 'pages/event_registrations', {
                event, 
                registrations: registrationsQueryResult ? registrationsQueryResult.items : [],
                totalRegistrations,
                pagination
            });
        })
        .fail(ui.showErrorPageCurry(res))
        .done();
});

module.exports.router = router;