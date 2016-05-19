\connect eventmanager;
begin transaction;

ALTER TABLE Registrations
DROP CONSTRAINT IF EXISTS registrations_event_id_fkey,
ADD CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES Events(events_id);

INSERT INTO migrations(name) VALUES ('v002___registrations_event_fix.sql');
end transaction;