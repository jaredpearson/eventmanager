'use strict';

var router = require('express').Router(),
    auth = require('../../middlewares/restAuth'),
    registrationDataSource = require('../../data_sources/registration');

router.post('/services/registrations', auth(), function(req, res) {
    if(!req.body) {
        return res.sendStatus(400);
    }

    var eventId, 
        userId, 
        attending;

    if (req.body.userId) {
        userId = req.body.userId;
    } else {
        userId = req.session.user_id
    }
    if (userId != req.session.user_id) {
        return res.status(400).json({
            success: false,
            error: 'userId property can only be the ID of the currently logged in user.'
        });
    }

    eventId = req.body.eventId;
    if (!eventId) {
        return res.status(400).json({
            success: false,
            error: 'eventId property is required.'
        });
    }

    if (typeof req.body.attending !== 'undefined' && req.body.attending !== true && req.body.attending !== false) {
        return res.status(400).json({
            success: false,
            error: 'attending must either be true or false.'
        });
    }
    if (req.body.attending === true) {
        attending = true;
    } else {
        attending = false;
    }

    registrationDataSource.findRegistrationByEventIdAndUserId(eventId, userId)
        .then(function(registration) {
            if (registration) {

                return res.status(400).json({
                    success: false,
                    error: 'Registration already exists for the user for this event.'
                });

            } else {

                return registrationDataSource.createRegistration(eventId, userId, req.session.user_id, attending)
                    .then(function(registrationId) {
                        if (registrationId) {
                            return registrationDataSource.findRegistrationById(registrationId)
                        } else {
                            return Q(undefined);
                        }
                    })
                    .then(function(registration) {
                        if (!registration) {
                            return res.sendStatus(500);
                        } else {
                            return res.json(registration);
                        }
                    });
            }
        })
        .fail(function(err) {
            console.log(err);
            res.sendStatus(500);
        })
        .done();
});

module.exports.router = router;
