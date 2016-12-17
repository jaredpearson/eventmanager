\connect eventmanager;
begin transaction;

CREATE TABLE EventFeedItems (
    event_feed_item_id SERIAL PRIMARY KEY,
    events_id INTEGER REFERENCES Events(events_id) NOT NULL,
    item_text TEXT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES Users(users_id) NOT NULL
);
GRANT all on EventFeedItems to webapp;
CREATE INDEX  event_feed_items_event_created_desc_idx ON EventFeedItems (events_id, created DESC);
GRANT usage, select on all sequences in schema public to webapp;

INSERT INTO migrations(name) VALUES ('v010___event_feed_items.sql');
end transaction;