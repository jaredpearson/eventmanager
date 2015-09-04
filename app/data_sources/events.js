'use strict';

var db = require('../db'),
    Q = require('q');

module.exports = {
    getNameMaxLength: function() {
        return 50;
    },

    getDescriptionMaxLength: function() {
        return 500;
    },

    createEvent: function(name, description, start, createdBy) {
        var client;
        return db.connect()
            .then(function(c) {
                client = c;
                return Q(c);
            })
            .then(function() {
                return client.query('INSERT INTO Events (event_name, description, start, created_by, owner) VALUES ($1::TEXT, $2::TEXT, to_timestamp($3::BIGINT), $4::INTEGER, $5::INTEGER) RETURNING events_id', [name, description, start.valueOf(), createdBy, createdBy]);
            })
            .then(function(result) {
                if (result.rowCount > 0) {
                    return Q(result.rows[0].events_id);
                } else {
                    return Q(undefined);
                }
            })
            .fin(function() {
                client.done();
            });
    }
};