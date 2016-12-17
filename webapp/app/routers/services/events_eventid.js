'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/restAuth');
const util = require('../../util');
const eventService = require('../../services/event_service');
const log = require('../../log');

router.get('/services/events/:eventId', auth(), (req, res) => {
    const eventId = req.params.eventId;
    if (!eventId || !util.isInt(eventId)) {
        res.sendStatus(404);
        return;
    }
    const contextUserId = req.session.user_id;
    
    eventService.findEventAndRegistrations(contextUserId, eventId)
        .then((event) => {
            res.json(event);
        })
        .fail((err) => {
            log.error(err);
            res.sendStatus(500);
        })
        .done();
});

module.exports.router = router;