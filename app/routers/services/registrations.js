'use strict';

var router = require('express').Router(),
    auth = require('../../middlewares/auth'),
    registrationDataSource = require('../../data_sources/registration');

router.post('/services/registrations', auth, function(req, res) {
    if(!req.body) {
        return res.sendStatus(400);
    }

    var eventId, 
        userId;

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

    registrationDataSource.findRegistrationByEventIdAndUserId(eventId, userId)
        .then(function(registration) {
            if (registration) {

                return res.status(400).json({
                    success: false,
                    error: 'Registration already exists for the user for this event.'
                });

            } else {
                
                return registrationDataSource.createRegistration(eventId, userId, req.session.user_id)
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
