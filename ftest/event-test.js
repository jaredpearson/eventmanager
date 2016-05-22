'use strict';

var moment = require('moment');

function getUrl(path) {
    var fullPath = casper.cli.raw.get('url') || 'http://localhost:8289/';
    if (!path) {
        return fullPath;
    }
    return fullPath + (path[0] === '/' ? path.substring(1) : path);
}

var testUser = {
    username: 'admin@tablemanager.com',
    password: '123456'
};

function LoginForm(casper, test) {
    this.casper = casper;
    this.test = test;
}
LoginForm.getUrl = function() {
    return getUrl('/login');
};
LoginForm.prototype.setUsername = function(username) {
    this.casper.fillSelectors('form[action="/login"]', {
        'input#username': username
    });
};
LoginForm.prototype.setPassword = function(password) {
    this.casper.fillSelectors('form[action="/login"]', {
        'input#password': password
    });
};
LoginForm.prototype.submit = function() {
    this.casper.click('input#submit');
};

function NewEventForm(casper, test) {
    this.casper = casper;
    this.test = test;
}
NewEventForm.getUrl = function() {
    return getUrl('/events/new');
};
NewEventForm.prototype.setName = function(name) {
    this.casper.fillSelectors('form[action="/events/new"]', {
        'input#name': name
    });
};
NewEventForm.prototype.setDescription = function(description) {
    this.casper.fillSelectors('form[action="/events/new"]', {
        'textarea#description': description
    });
};
NewEventForm.prototype.setStart = function(start) {
    this.casper.fillSelectors('form[action="/events/new"]', {
        'input#start': start
    });
};
NewEventForm.prototype.submit = function() {
    this.casper.click('input#submit');
}

// executes the function after a casper test has been initialized
// and a user has logged in
function withAuth(casper, test) {
    casper.start(LoginForm.getUrl());
    casper.then(function() {
        var loginForm = new LoginForm(casper, test);
        loginForm.setUsername(testUser.username);
        loginForm.setPassword(testUser.password);
        loginForm.submit();
    });
    return casper;
}

casper.test.begin('Verify event create', 8, function(test) {
    var eventName = 'test ' + Date.now();
    var eventDescription = '<script>alert("Hello!")</script>';
    var eventStartMoment = moment().add(7, 'days');
    var eventStartDateFormatted = eventStartMoment.format('dddd, MMMM D, YYYY');
    var eventStartTimeFormatted = eventStartMoment.format('H:mm A');

    withAuth(casper, test)
        .thenOpen(NewEventForm.getUrl())
        .then(function() {
            var newEventForm = new NewEventForm(this, test);
            newEventForm.setName(eventName);
            newEventForm.setDescription(eventDescription);
            newEventForm.setStart(eventStartMoment.format());
            newEventForm.submit();
        })
        .then(function() {
            test.assertSelectorHasText('#page-title', eventName, 'does event name match');
            test.assertSelectorHasText('#event-description', eventDescription, 'does event description match');
            test.assertSelectorHasText('#event-start-date', eventStartDateFormatted, 'does start date match');
            test.assertSelectorHasText('#event-start-time', eventStartTimeFormatted, 'does start time match');
            test.assertSelectorHasText('#event-registrations-container', 'No attendees yet.', 'has no registrations');
            test.assertVisible('#attending_question', 'RSVP question is visible');
            test.assertVisible('#attend_yes', 'RSVP yes button visible');
            test.assertVisible('#attend_no', 'RSVP no button visible');
        })
        .run(function() {
            test.done();
        });
});
