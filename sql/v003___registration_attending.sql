
ALTER TABLE Registrations
ADD COLUMN attending BOOLEAN;

UPDATE Registrations SET attending = true;
