'use strict';

const session = require('../session');
const usersDataSource = require('../data_sources/users');

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

            const userId = tokenObj.userId;
            usersDataSource.getUserById(userId)
                .then((user) => {
                    if (user) {
                        req.user = user;
                        req.session.user_id = user.id;
                        next();

                    } else {
                        res.sendStatus(403);
                    }
                })
                .fail((err) => {
                    console.log(err);
                    res.sendStatus(403);
                })
                .done();

        }
    } catch(e) {
        console.log(e);
        res.sendStatus(403);
        return;
    }
};
