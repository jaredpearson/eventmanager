
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE Users (
    users_id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    login_attempts SMALLINT DEFAULT 0,
    login_lock_timestamp TIMESTAMP,
    last_login TIMESTAMP,
    number_of_logins SMALLINT DEFAULT 0,
    welcome_key TEXT UNIQUE
);

CREATE TABLE Events (
    events_id SERIAL PRIMARY KEY,
    event_name TEXT NOT NULL,
    owner INTEGER REFERENCES Users(users_id),
    start TIMESTAMP NOT NULL,
    description TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES Users(users_id)
);

CREATE TABLE Registrations (
    registrations_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES Users(users_id),
    user_id INTEGER REFERENCES Users(users_id),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES Users(users_id)
);
