'use strict';

var router = require('express').Router(),
    auth = require('../middlewares/auth'),
    eventsDataSource = require('../data_sources/events'),
    ui = require('../ui');

router.get('/home', auth(), function(req, res) {
    var contextUserId = req.session.user_id;

    eventsDataSource.getUpcomingEvents(contextUserId)
        .then(function(events) {
            res.render('pages/home', {
                events: events
            });
        })
        .fail(function(err) {
            ui.showErrorPage(res, err);
        })
        .done();

});

module.exports.router = router;