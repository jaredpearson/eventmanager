
/**
 * General utility for handling $.ajax fail
 */
function handleAjaxFailWithAlert(msg, callback) {
    return function(xhr, status, err) {
        alert(msg);
        console.log(xhr, status, err);
        if (callback) {
            callback(msg, xhr, status, err);
        }
    };
}

function EventStore(sessionId) {
    this.sessionId = sessionId; 
}
/**
 * Loads an event with the given event ID from the server
 */
EventStore.prototype.fetchRemote = function(eventId, successCallback, failCallback) {
    $.ajax('/services/events/' + eventId, {
            method: 'GET',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            headers: {
                'Authorization': 'Bearer ' + this.sessionId
            }
        })
        .done(function(data, status, xhr) {
            if (xhr.status === 200) {
                if (successCallback) {
                    successCallback(data);
                }
            } else {
                alert('Loading event failed. Please reload the page.');
                console.log(data, status, xhr);
            }
        }.bind(this))
        .fail(handleAjaxFailWithAlert('Loading event failed. Please reload the page.', failCallback));
}

function EventFeedItemStore(sessionId) {
    this.sessionId = sessionId;
}
/**
 * Loads the feed items for the specified event
 * @param {Number} eventId
 */
EventFeedItemStore.prototype.fetchAllFromRemote = function(eventId, successCallback, failCallback) {
    $.ajax('/services/events/' + eventId + '/feedItems', {
            method: 'GET',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            headers: {
                'Authorization': 'Bearer ' + this.sessionId
            }
        })
        .done(function(data, status, xhr) {
            if (xhr.status === 200) {
                if (successCallback) {
                    successCallback(data);
                }
            } else {
                alert('Loading event feed items failed. Please reload the page.');
                console.log(data, status, xhr);
            }
        }.bind(this))
        .fail(handleAjaxFailWithAlert('Loading event feed items failed. Please reload the page.', failCallback));
}
/**
 * Inserts a new feed item
 * @param {{eventId: Number, text:String}} newFeedItem
 * @param {Function} successCallback
 * @param {Function} failCallback
 */
EventFeedItemStore.prototype.insertFeedItem = function(newFeedItem, successCallback, failCallback) {
    var eventId = newFeedItem.eventId;
    delete newFeedItem.eventId;
    $.ajax('/services/events/' + eventId + '/feedItems', {
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newFeedItem),
            headers: {
                'Authorization': 'Bearer ' + this.sessionId
            }
        })
        .done(function(data, status, xhr) {
            if (xhr.status === 200) {
                if (successCallback) {
                    successCallback(data);
                }
            } else {
                alert('Failed to create new feed item. Please reload the page.');
                console.log(data, status, xhr);
            }
        }.bind(this))
        .fail(handleAjaxFailWithAlert('Failed to create new feed item. Please reload the page.', failCallback));
}

/**
 * Data store for Registration information
 * @param {String} sessionId the ID of the session used when connecting to the server
 */
function RegistrationStore(sessionId) {
    this.sessionId = sessionId;
}
/**
 * Inserts a new registration
 * @param {Object} newRegistration the registration to be inserted
 * @param {Function} successCallback the callback to be invoked when the registration is inserted
 */
RegistrationStore.prototype.insertRegistration = function(newRegistration, successCallback) {
    $.ajax('/services/registrations', {
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newRegistration),
            headers: {
                'Authorization': 'Bearer ' + this.sessionId
            }
        })
        .done(function(data, status, xhr) {
            if (xhr.status === 200) {
                if (successCallback) {
                    successCallback(data);
                }
            } else {
                alert('Registration failed. Please try again');
                console.log(data);
            }
        })
        .fail(handleAjaxFailWithAlert('Registration failed. Please try again'));
}
/**
 * Updates the registration with the specified patch
 * @param {Number} registrationId the ID of the registration
 * @param {Object} registrationPatch the properties to be updated when patching
 * @param {Function} successCallback the callback to be invoked when the registration is updated  
 */
RegistrationStore.prototype.updateRegistration = function(registrationId, registrationPatch, successCallback) {
    $.ajax('/services/registrations/' + registrationId, {
            method: 'PATCH',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(registrationPatch),
            headers: {
                'Authorization': 'Bearer ' + this.sessionId
            }
        })
        .done(function(data, status, xhr) {
            if (xhr.status === 200) {

                // PATCH doesn't send back the registration so we fake it by
                // copying the registration in the page and updating the attending
                // property.
                var registration = Object.assign({}, registrationPatch);
                
                if (successCallback) {
                    successCallback(registration);
                }

            } else {
                alert('Registration failed. Please try again');
                console.log(data);
            }
        })
        .fail(handleAjaxFailWithAlert('Registration failed. Please try again'));
}

function AttendingRegistrationsComponent(attributes) {
    this.event = attributes.event;
    this.$el = $('#event-registrations-container');
}
AttendingRegistrationsComponent.prototype.render = function() {
    this.$el.empty();

    var attendeeContainerEl = $('<div>');
    if (this.event.attendees && this.event.attendees.length > 0) {
        this.event.attendees.forEach(function(attendee) {
            $('<div>')
                .text(attendee.name)
                .appendTo(attendeeContainerEl);
        })
    } else {
        $('<div>No attendees yet.</div>')
            .appendTo(attendeeContainerEl)
    }
    this.$el.append(attendeeContainerEl);

    if (this.event.registrations.total > 0) {
        var anchorEl = $('<a>')
            .attr('href', '/events/' + this.event.id + '/registrations')
            .text('View All ' + this.event.registrations.total + ' Registrations');
        $('<div>').append(anchorEl).appendTo(attendeeContainerEl);
    }
}

function RsvpComponent(attributes) {
    this.showRsvpForm = attributes.showRsvpForm;
    this.attending = attributes.attending;
    this.hasRegistration = attributes.hasRegistration;
}
RsvpComponent.prototype.render = function() {
    if (this.showRsvpForm) {
        $('#attending_question').addClass('show').removeClass('hidden');
        $('#attending_confirmed').addClass('hidden').removeClass('show');
    } else {
        $('#attending_question').addClass('hidden').removeClass('show');
        $('#attending_confirmed').addClass('show').removeClass('hidden');
    }
    
    if (this.attending) {
        $('#attending_confirmed_yes').addClass('show').removeClass('hidden');
        $('#attending_confirmed_no').addClass('hidden').removeClass('show');
        $('#attend_yes').addClass('btn-success');
        $('#attend_no').removeClass('btn-success');
    } else {
        $('#attending_confirmed_yes').addClass('hidden').removeClass('show');
        $('#attending_confirmed_no').addClass('show').removeClass('hidden');
        $('#attend_yes').removeClass('btn-success');
        if (this.hasRegistration) {
            $('#attend_no').addClass('btn-success');
        }
    }
}

function createFeedItemElement(feedItem) {
    var containerEl = $('<div>').addClass('feed-item');
    $('<div>')
        .addClass('feed-item-header')
        .append($('<span>').addClass('feed-item-name').text(feedItem.createdBy.name))
        .append($('<span>').addClass('feed-item-created').text(feedItem.createdDateFormatted + ' ' + feedItem.createdTimeFormatted))
        .appendTo(containerEl);
    $('<div>')
        .addClass('feed-item-text')
        .text(feedItem.text)
        .appendTo(containerEl);
    return containerEl;
}

function FeedComponent(attributes) {
    this.feedItems = (attributes.feedItems || []);
}
FeedComponent.prototype.render = function() {
    var feedContainerEl = $('#feed-container').empty();
    if (this.feedItems.length > 0) {
        feedContainerEl.append(this.feedItems.map(createFeedItemElement));
    } else {
        feedContainerEl.append($('<div>Start chatting about this event</div>'))
    }
}

function FeedInputComponent(attributes) {
    this.feedInput = (attributes.feedInput || {});
    this.eventId = attributes.eventId;
    this.onFeedItemCreate = attributes.onFeedItemCreate;
    this.onFeedInputChange = attributes.onFeedInputChange;
}
FeedInputComponent.prototype.attachEvents = function() {
    if (!FeedInputComponent.eventsAttached) {
        FeedInputComponent.eventsAttached = true;
        $(document).on('click', 'button#feed-input-submit', function(e) {
            e.preventDefault();
            var text = $('#feed-item-text').val();
            if (text && text.trim().length > 0 && this.onFeedItemCreate) {
                this.onFeedItemCreate({
                    eventId: this.eventId,
                    text: text
                });
            }
        }.bind(this));

        $(document).on('change', '#feed-item-text', function(e) {
            if (this.onFeedInputChange) {
                this.onFeedInputChange({
                    text: $('#feed-item-text').val()
                });
            }
        }.bind(this));
    }
    return this;
}
FeedInputComponent.prototype.render = function() {
    $('#feed-item-text').val(this.feedInput.text);
    return this;
}

/**
 * @param {EventStore} eventStore
 * @param {RegistrationStore} registrationStore
 * @param {EventFeedItemStore} eventFeedItemStore
 */
function EventViewPage(eventStore, registrationStore, eventFeedItemStore, event) {
    this.eventStore = eventStore;
    this.registrationStore = registrationStore;
    this.eventFeedItemStore = eventFeedItemStore;
    this.eventData = event;
    this.state = {
        showRsvpForm: null,
        pendingRegistration: null,
        feedItems: event.feedItems.items
    };
}
EventViewPage.prototype.init = function() {
    var eventData = this.eventData;

    // initialize the state for page
    this.state.showRsvpForm = !eventData.myRegistration;

    // setup the document handlers
    // TODO: these should be on the RsvpComponent
    $(document).on('click', 'a#attend_yes', function(e) {
        e.preventDefault();
        this._upsertRegistration(true);
    }.bind(this));
    $(document).on('click', 'a#attend_no', function(e) {
        e.preventDefault();
        this._upsertRegistration(false);
    }.bind(this));
    $(document).on('click', 'a#attending_change', function(e) {
        e.preventDefault();
        this.state.showRsvpForm = true;
        this.updateView();
    }.bind(this));

    this.updateView();

    return this;
};
EventViewPage.prototype.updateView = function() {
    var event = this.eventData;

    // if the user has a pending registration or a real registration and either
    // is attending, then we need to make sure the form shows as attending.
    var hasRegistration = this.state.pendingRegistration || event.myRegistration;
    var attending = (this.state.pendingRegistration && this.state.pendingRegistration.attending) || 
        (event.myRegistration && event.myRegistration.attending);

    new RsvpComponent({
        showRsvpForm: this.state.showRsvpForm,
        hasRegistration: hasRegistration, 
        attending: attending
    }).render();

    new AttendingRegistrationsComponent({
        event: event
    }).render();

    new FeedInputComponent({
        eventId: event.id,
        feedInput: this.state.feedInput,
        onFeedInputChange: this.onFeedInputChange.bind(this),
        onFeedItemCreate: this.onFeedItemCreate.bind(this)
    })
        .attachEvents()
        .render();

    new FeedComponent({
        feedItems: this.state.feedItems
    }).render();
};
EventViewPage.prototype.onRegistrationUpdate = function(registration) {
    // immediately set the state of the page so that the view doesn't
    // have an invalid state for a period of time
    this.state.pendingRegistration = registration;
    this.state.showRsvpForm = false;
    this.updateView();

    // trigger to reload the event state from the server
    this.eventStore.fetchRemote(this.eventData.id, function(data) {
        this.eventData = data;
        this.state.pendingRegistration = null;
        this.state.showRsvpForm = !data.myRegistration;
        this.updateView();
    }.bind(this));
};
EventViewPage.prototype._upsertRegistration = function(attending) {
    var eventId = this.eventData.id;
    var registration = this.eventData.myRegistration;
    var registrationId = registration && registration.id;
    var hasRegistration = !!registrationId;
    if (!hasRegistration) {
        // if no registration yet, create one
        
        var newRegistration = {
            eventId: eventId,
            attending: attending
        };
        this.registrationStore.insertRegistration(newRegistration, this.onRegistrationUpdate.bind(this));

    } else {
        // update an existing registration
        var registrationPatch = {
            attending: attending
        }
        this.registrationStore.updateRegistration(registrationId, registrationPatch, this.onRegistrationUpdate.bind(this));
    }
};
EventViewPage.prototype.onFeedInputChange = function(feedInput) {
    this.state.feedInput = Object.assign({}, this.state.feedInput, feedInput);
};
EventViewPage.prototype.onFeedItemCreate = function(newFeedItem) {
    this.eventFeedItemStore.insertFeedItem(newFeedItem, function() {
        this.eventFeedItemStore.fetchAllFromRemote(this.eventData.id, function(feedItems) {
            this.state.feedItems = feedItems.items;
            this.state.feedInput = Object.assign({}, this.state.feedInput, {
                text: ''
            });
            this.updateView();
        }.bind(this));
    }.bind(this));
};
