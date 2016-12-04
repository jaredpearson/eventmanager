\connect eventmanager;
begin transaction;

CREATE TABLE Invitations (
    invitation_id SERIAL,
    code TEXT NOT NULL,
    created TIMESTAMP DEFAULT now(),
    used BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES Users(users_id)
);
CREATE INDEX invitations_code_used_idx ON Invitations (code, used, invitation_id);

GRANT all on Invitations to webapp;
GRANT usage, select on all sequences in schema public to webapp;

INSERT INTO migrations(name) VALUES ('v009___invitation.sql');
end transaction;