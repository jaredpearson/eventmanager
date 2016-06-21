'use strict';

const jwt = require('jsonwebtoken');

const privateKey = 'Dl2hro13ohBpHa';

const options = {
    expiresIn: '2 days'
};

module.exports = {
    generateSessionToken(user) {
        return jwt.sign({userId: user.id}, privateKey, options);
    },

    verify(token) {
        return jwt.verify(token, privateKey);
    }
};
