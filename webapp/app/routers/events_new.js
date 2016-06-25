'use strict';

var router = require('express').Router(),
    auth = require('../middlewares/auth'),
    eventsDataSource = require('../data_sources/events'),
    moment = require('moment-timezone'),
    ui = require('../ui');

router.get('/events/new', auth(), function(req, res) {

    const defaultStart = moment()
        .add(7, 'days')
        .hour(19)
        .minute(0)
        .second(0)
        .milliseconds(0);

    res.render('pages/event_new', {
        start: defaultStart.format('YYYY-MM-DDTHH:mm:ss')
    })
});

router.post('/events/new', auth(), function(req, res) {
    var errors = [];
    var parsedStartDate;
    var parsedDescription;
    var pageModel = {};
    pageModel.name = req.body.name;
    pageModel.description = req.body.description;
    pageModel.start = req.body.start;

    // validate the form values
    if (!pageModel.name || pageModel.name.trim().length === 0) {
        errors.push('Name is required');
    } else if(pageModel.name.trim().length >= eventsDataSource.getNameMaxLength()) {
        errors.push('Name must be shorter than ' + eventsDataSource.getNameMaxLength() + ' characters.');
    }

    if (pageModel.description && pageModel.description.length >= eventsDataSource.getDescriptionMaxLength()) {
        errors.push('Description must be shorter than ' + eventsDataSource.getDescriptionMaxLength() + ' characters.');
    }

    if (!pageModel.start) {
        errors.push('Start date and time is required');
    } else if (!moment(pageModel.start).isValid()) {
        errors.push('Unable to determine start date and time. Try specifying in YYYY-MM-DD HH:MM format.')
    }

    if (errors.length > 0) {
        pageModel.errors = errors;
        res.render('pages/event_new', pageModel);
        return;
    }

    // attempt to parse the date/time specified by the user
    // TODO: assume the user is in PST
    parsedStartDate = moment.tz(pageModel.start, 'America/Los_Angeles');
    parsedDescription = (pageModel.description) ? pageModel.description.trim() : undefined;

    eventsDataSource.createEvent(pageModel.name.trim(), parsedDescription, parsedStartDate, req.session.user_id)
        .then(function(eventId) {

            if (eventId) {
                console.log('Event saved: ' + eventId);
                res.redirect('/events/' + eventId);
            } else {
                pageModel.errors = ['Unable to save the event'];
                res.render('pages/event_new', pageModel);
            }

        })
        .fail(function(err) {
            ui.showErrorPage(res, err);
        })
        .done();

});

module.exports.router = router;