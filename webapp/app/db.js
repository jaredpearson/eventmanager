'use strict';

const pg = require('pg');
const Q = require('q');
const pgconnect = Q.nbind(pg.connect, pg);
const log = require('./log');

// Postgres uses bigint types for count among other things. The pg
// library converts them to strings so that there isn't a buffer overflow.
// Since we don't expect to ever have bigint data in Postgres greater than 
// Number.MAX_VALUE, just turn on bigint parsing. 
// https://github.com/brianc/node-postgres/issues/378#issuecomment-19979510
require('pg').defaults.parseInt8 = true;

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
        log.debug('Releasing DB connection');
        this._pgdone(this._pgclient);
    }
}

module.exports = {
    /**
     * @returns {Promise<Client>}
     */
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
