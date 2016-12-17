'use strict';

const db = require('../db');

module.exports = {
    /**
     * Creates a new EventFeedItem and returns the ID of the new row
     * @param {String} text
     * @param {Number} eventId
     * @param {Number} createdBy
     * @returns {Promise<Number>}
     */
    createFeedItem(text, eventId, createdBy) {
        return db.query({
                name: 'event_feed_item_insert',
                text: 'INSERT INTO EventFeedItems (item_text, events_id, created_by) VALUES ($1::TEXT, $2::INTEGER, $3::INTEGER) RETURNING event_feed_item_id',
                values: [text, eventId, createdBy]
            })
            .then((result) => {
                if (result.rowCount > 0) {
                    return result.rows[0].event_feed_item_id;
                } else {
                    return undefined;
                }
            });
    }
};
