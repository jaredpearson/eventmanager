\connect eventmanager;
begin transaction;

ALTER TABLE Registrations
ADD COLUMN attending BOOLEAN;

UPDATE Registrations SET attending = true;

INSERT INTO migrations(name) VALUES ('v003__registration_attending.sql');
end transaction;
