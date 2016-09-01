'use strict';

const router = require('express').Router();
const auth = require('../middlewares/auth');
const eventService = require('../services/event_service');
const ui = require('../ui');

router.get('/home', auth(), (req, res) => {
    var contextUserId = req.session.user_id;

    eventService.getUpcomingEvents(contextUserId)
        .then((events) => {
            res.render('pages/home', {
                events: events
            });
        })
        .fail((err) => ui.showErrorPage(res, err))
        .done();
});

module.exports.router = router;