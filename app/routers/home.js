'use strict';

var router = require('express').Router(),
    auth = require('../middlewares/auth'),
    eventsDataSource = require('../data_sources/events');

function HomeListEventModel(event) {
    this.name = event.name;
    this.start = event.start;
    this.startDateFormatted = event.start.format('ddd MMM D'); // Tues Sep 8
    this.startTimeFormatted = event.start.format('H:mm A');    // 10:33 AM
}

function convertEventsToEventModels(events) {
    var eventModels = [];
    events.forEach(function(event) {
        eventModels.push(new HomeListEventModel(event));
    });
    return eventModels;
}

router.get('/home', auth, function(req, res) {

    eventsDataSource.getNewestEvents()
        .then(function(events) {
            var eventModels = convertEventsToEventModels(events);
            res.render('pages/home', {
                events: eventModels
            });
        })
        .fail(function(err) {
            console.error(err);
            res.render('pages/unexpected_error');
        })
        .done();

});

module.exports.router = router;