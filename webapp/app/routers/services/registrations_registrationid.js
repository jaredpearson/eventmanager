'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/restAuth');
const util = require('../../util');
const registrationDataSource = require('../../data_sources/registration');

router.patch('/services/registrations/:registrationId', auth(), (req, res) => {
    const registrationId = req.params.registrationId;
    if (!registrationId || !util.isInt(registrationId)) {
        res.sendStatus(404);
        return;
    }
    
    const attending = req.body.attending;
    if (!(attending === true || attending === false)) {
        return res.status(400).json({
            success: false,
            error: 'attending property is required and must be true or false'
        });
    }
    
    registrationDataSource.updateAttending(registrationId, attending)
        .then(() => {
            // TODO: not sure what rep to return on a patch
            res.json({});
        })
        .fail(() => {
            console.log(err);
            res.sendStatus(500);
        })
        .done();
});

module.exports.router = router;