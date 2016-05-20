\connect eventmanager;
begin transaction;

INSERT INTO Users (
    username,
    password
) VALUES (
    'admin@tablemanager.com',
    crypt('123456', gen_salt('bf', 11)),
    'Admin',
    'User'
);

INSERT INTO migrations(name) VALUES ('v006___admin_user.sql');
end transaction;
