'use strict';

const router = require('express').Router();

router.get('/logout', (req, res) => {
    delete req.session.user_id;
    res.redirect('/login');
});

module.exports.router = router;
