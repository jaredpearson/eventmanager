'use strict';

function EventModel(event) {
    this.id = event.id;
    this.name = event.name;
    this.start = event.start;
    this.startDateFormatted = event.start.format('ddd MMM D'); // Tues Sep 8
    this.startFullDateFormatted = event.start.format('dddd, MMMM D, YYYY'); // Tuesday, September 8, 2015
    this.startTimeFormatted = event.start.format('H:mm A');    // 10:33 AM
}

module.exports = EventModel;