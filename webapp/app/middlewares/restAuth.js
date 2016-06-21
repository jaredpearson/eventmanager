'use strict';

const session = require('../session');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');

    if (!authHeader) {
        res.sendStatus(403);
        return;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
        res.sendStatus(403);
        return;
    }

    const token = authHeader.substring(7);
    try {
        const tokenObj = session.verify(token); 
        if (!tokenObj) {
            res.sendStatus(403);
            return;
        } else {
            req.session.user_id = tokenObj.userId;
        }
    } catch(e) {
        console.log(e);
        res.sendStatus(403);
        return;
    }

    next();
};
