\connect eventmanager;
begin transaction;

GRANT usage, select on all sequences in schema public to webapp;

INSERT INTO migrations(name) VALUES ('v007___grant_sequence.sql');
end transaction;