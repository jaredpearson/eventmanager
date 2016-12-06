'use strict';

const bunyan = require('bunyan');

const log = bunyan.createLogger({name: 'webapp'});

module.exports = log;
