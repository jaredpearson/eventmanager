'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const eventService = require('../../services/event_service');
const ui = require('../../ui');

router.get('/events', auth(), (req, res) => {
    // TODO for now, just go back home
    res.redirect('/home');
});

module.exports.router = router;
