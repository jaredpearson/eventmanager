\connect eventmanager;
begin transaction;

CREATE INDEX registrations_event_id_idx ON Registrations (event_id, user_id);

INSERT INTO migrations(name) VALUES ('v005__registration_indexes.sql');
end transaction;