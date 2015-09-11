'use strict';

var router = require('express').Router(),
    auth = require('../middlewares/auth'),
    eventsDataSource = require('../data_sources/events')

router.get('/home', auth, function(req, res) {
    var contextUserId = req.session.user_id;

    eventsDataSource.getNewestEvents(contextUserId)
        .then(function(events) {
            res.render('pages/home', {
                events: events
            });
        })
        .fail(function(err) {
            console.error(err);
            res.render('pages/unexpected_error');
        })
        .done();

});

module.exports.router = router;