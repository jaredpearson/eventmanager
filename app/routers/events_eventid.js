'use strict';

var router = require('express').Router(),
    auth = require('../middlewares/auth'),
    util = require('../util'),
    eventsDataSource = require('../data_sources/events');

router.get('/events/:eventId', auth, function(req, res) {
    var eventId = req.params.eventId;
    if (!eventId || !util.isInt(eventId)) {
        res.sendStatus(404);
        return;
    }
    var contextUserId = req.session.user_id;

    eventsDataSource.findEventById(contextUserId, eventId)
        .then(function(event) {
            if (event) {
                res.render('pages/event_view', {
                    event: event,
                    myRegistration: event.myRegistration,
                    hasRegistration: typeof event.myRegistration !== 'undefined'
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