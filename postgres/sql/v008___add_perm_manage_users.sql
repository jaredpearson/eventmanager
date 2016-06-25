\connect eventmanager;
begin transaction;

ALTER TABLE Users
ADD COLUMN perm_manage_users BOOLEAN DEFAULT false NOT NULL;

UPDATE Users SET perm_manage_users = true WHERE username = 'admin@tablemanager.com';

INSERT INTO migrations(name) VALUES ('v008___add_perm_manage_users.sql');
end transaction;