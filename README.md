# Event Manager

## Dev Setup

1. Install [Node.js](https://nodejs.org) version at least 0.10.0.
2. Install [NPM](https://www.npmjs.com/) if it was not installed with Node.js.
3. Install grunt-cli.

    npm install -g grunt-cli

4. Install [PostgreSQL](http://www.postgresql.org/download/).
5. Create a database in PostgreSQL.

    psql -c "CREATE DATABASE eventmanager;"

6. Create the environment variable for the database connection.

    export DATABASE_URL=postgres:///eventmanager

7. Install the pg-simple-migrate-cli project.

    npm install git+ssh://git@bitbucket.org/jaredpearson/pg-simple-migrate-cli.git#1.0.0 -g

8. Clone the source.

    git clone git@bitbucket.org:jaredpearson/eventmanager.git

9. Run the migrations from the `eventmanager` directory. This will update the database to the newest version.

    cd eventmanager
    npm install
    migrate

10. Compile the source.

    grunt dist

11. Start the server.

    node index.js
