'use strict';

var _ = require('underscore');

function formatAsHtml(text) {
    if (!text) {
        return text;
    }

    var textAsHtml;

    // escape &, <, >, ", etc
    textAsHtml = _.escape(text);

    // turn line breaks into HTML line breaks
    textAsHtml = textAsHtml.replace(/\n/g, '<br />');

    return textAsHtml;
}

function EventModel(event) {
    this.id = event.id;
    this.name = event.name;
    this.start = event.start;
    this.description = event.description;
    this.descriptionHtml = formatAsHtml(event.description);
    this.startDateFormatted = event.start.format('ddd MMM D'); // Tues Sep 8
    this.startFullDateFormatted = event.start.format('dddd, MMMM D, YYYY'); // Tuesday, September 8, 2015
    this.startTimeFormatted = event.start.format('H:mm A');    // 10:33 AM
    this.myRegistration = event.myRegistration;
}

module.exports = EventModel;