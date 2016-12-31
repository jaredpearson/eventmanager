'use strict';

const router = require('express').Router();
const auth = require('../middlewares/auth');
const eventService = require('../services/event_service');
const ui = require('../ui');

router.get('/home', auth(), (req, res) => {
    var contextUserId = req.session.user_id;

    eventService.getUpcomingEvents(contextUserId)
        .then(events => {
            ui.renderStandard(req, res, 'pages/home', {
                events
            });
        })
        .fail(ui.showErrorPageCurry(res))
        .done();
});

module.exports.router = router;