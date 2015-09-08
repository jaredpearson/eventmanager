
ALTER TABLE Registrations
DROP CONSTRAINT IF EXISTS registrations_event_id_fkey,
ADD CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES Events(events_id);
