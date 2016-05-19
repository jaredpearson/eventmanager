CREATE DATABASE eventmanager;
\connect eventmanager;
begin transaction;

CREATE INDEX events_created_desc_idx ON Events (created DESC, events_id);

INSERT INTO migrations(name) VALUES ('v004__indexes.sql');
end transaction;