'use strict';

const pg = require('pg');
const Q = require('q');
const pgconnect = Q.nbind(pg.connect, pg);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL environment variable expected');
    process.exit(1);
}

class Client{
    constructor(pgclient, pgdone) {
        this._pgclient = pgclient;
        this._pgdone = pgdone;

        // create a promise version of the pg Client.query method
        this.query = Q.nbind(pgclient.query, pgclient);
    }
    done() {
        this._pgdone(this._pgclient);
    }
}

module.exports = {
    connect() {
        return pgconnect(connectionString)
            .spread(function(client, done) {
                return Q(new Client(client, done));
            });
    },
    query() {
        const thatArgs = arguments;
        return this.connect()
            .then((client) => {
                return client.query.apply(this, thatArgs)
                    .fin(() => client.done());
            });
    }
};
