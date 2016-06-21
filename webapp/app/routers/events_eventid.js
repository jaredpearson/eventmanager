'use strict';

const router = require('express').Router(),
    auth = require('../middlewares/auth'),
    util = require('../util'),
    eventService = require('../services/event_service'),
    ui = require('../ui'),
    session = require('../session');

router.get('/events/:eventId', auth, (req, res) => {
    const eventId = req.params.eventId;
    if (!eventId || !util.isInt(eventId)) {
        res.sendStatus(404);
        return;
    }
    const contextUserId = req.session.user_id;
    
    eventService.findEventAndRegistrations(contextUserId, eventId)
        .then((eventAndRegistration) => {
            if (eventAndRegistration) {
                res.render('pages/event_view', Object.assign(
                    {},
                    eventAndRegistration,
                    {
                        // TODO: generate a single token on login instead of each page view
                        sessionId: session.generateSessionToken({id: contextUserId})
                    }
                ));
            } else {
                res.sendStatus(404);
            }
        })
        .fail(function(err) {
            ui.showErrorPage(res, err);
        })
        .done();
});

module.exports.router = router;