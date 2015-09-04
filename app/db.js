'use strict';

var pg = require('pg'),
    Q = require('q'),
    pgconnect = Q.nbind(pg.connect, pg);

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable expected');
    process.exit(1);
}

function Client(pgclient, pgdone) {
    this._pgclient = pgclient;
    this._pgdone = pgdone;

    // create a promise version of the pg Client.query method
    this.query = Q.nbind(pgclient.query, pgclient);
}
Client.prototype.done = function() {
    this._pgdone(this._pgclient);
};

module.exports = {
    connect: function(){
        return pgconnect(process.env.DATABASE_URL)
            .spread(function(client, done) {
                return Q(new Client(client, done));
            });
    }
}
