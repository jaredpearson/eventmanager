'use strict';

const router = require('express').Router();
const auth = require('../../../middlewares/restAuth');
const util = require('../../../util');
const eventService = require('../../../services/event_service');
const log = require('../../../log');

router.get('/services/events/:eventId/feeditems', auth(), (req, res) => {
    const eventId = req.params.eventId;
    if (!eventId || !util.isInt(eventId)) {
        return res.sendStatus(404);
    }
    const contextUserId = req.session.user_id;
    
    eventService.findEventAndRegistrations(contextUserId, eventId)
        .then((event) => {
            if (!event) {
                return res.sendStatus(404);
            }
            res.json(event.feedItems);
        })
        .fail((err) => {
            log.error(err);
            res.sendStatus(500);
        })
        .done();
});

router.post('/services/events/:eventId/feeditems', auth(), (req, res) => {
    const eventId = req.params.eventId;
    if (!eventId || !util.isInt(eventId)) {
        return res.sendStatus(404);
    }
    const contextUserId = req.session.user_id;

    const text = req.body.text;
    if (typeof text === 'undefined' || text.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'text property is required.'
        });
    }
    
    eventService.findEventAndRegistrations(contextUserId, eventId)
        .then((event) => {
            if (!event) {
                return res.sendStatus(404);
            }
            return eventService.createFeedItem(text, eventId, contextUserId)
                .then((data) => res.json(data));
        })
        .fail((err) => {
            log.error(err);
            res.sendStatus(500);
        })
        .done();
});


module.exports.router = router;