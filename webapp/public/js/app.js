
/**
 * General utility for handling $.ajax fail
 */
function handleAjaxFailWithAlert(msg, callback) {
    return (xhr, status, err) => {
        alert(msg);
        console.log(xhr, status, err);
        if (callback) {
            callback(msg, xhr, status, err);
        }
    };
}

class EventStore {
    constructor(sessionId) {
        this.sessionId = sessionId; 
    }

    /**
     * Loads an event with the given event ID from the server
     */
    fetchRemote(eventId, successCallback = ()=>{}, failCallback = ()=>{}) {
        $.ajax('/services/events/' + eventId, {
                method: 'GET',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                headers: {
                    'Authorization': 'Bearer ' + this.sessionId
                }
            })
            .done((data, status, xhr) => {
                if (xhr.status === 200) {
                    successCallback(data);
                } else {
                    alert('Loading event failed. Please reload the page.');
                    console.log(data, status, xhr);
                }
            })
            .fail(handleAjaxFailWithAlert('Loading event failed. Please reload the page.', failCallback));
    }
}

class EventFeedItemStore {
    constructor(sessionId) {
        this.sessionId = sessionId;
    }

    /**
     * Loads the feed items for the specified event
     * @param {Number} eventId
     */
    fetchAllFromRemote(eventId, successCallback = ()=>{}, failCallback = ()=>{}) {
        $.ajax('/services/events/' + eventId + '/feedItems', {
                method: 'GET',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                headers: {
                    'Authorization': 'Bearer ' + this.sessionId
                }
            })
            .done((data, status, xhr) => {
                if (xhr.status === 200) {
                    successCallback(data);
                } else {
                    alert('Loading event feed items failed. Please reload the page.');
                    console.log(data, status, xhr);
                }
            })
            .fail(handleAjaxFailWithAlert('Loading event feed items failed. Please reload the page.', failCallback));
    }

    /**
     * Inserts a new feed item
     * @param {{eventId: Number, text:String}} newFeedItem
     * @param {Function} successCallback
     * @param {Function} failCallback
     */
    insertFeedItem(newFeedItem, successCallback = ()=>{}, failCallback = ()=>{}) {
        const eventId = newFeedItem.eventId;
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
            .done((data, status, xhr) => {
                if (xhr.status === 200) {
                    successCallback(data);
                } else {
                    alert('Failed to create new feed item. Please reload the page.');
                    console.log(data, status, xhr);
                }
            })
            .fail(handleAjaxFailWithAlert('Failed to create new feed item. Please reload the page.', failCallback));
    }
}

class RegistrationStore {
    /**
     * Data store for Registration information
     * @param {String} sessionId the ID of the session used when connecting to the server
     */
    constructor(sessionId) {
        this.sessionId = sessionId;
    }

    /**
     * Inserts a new registration
     * @param {Object} newRegistration the registration to be inserted
     * @param {Function} successCallback the callback to be invoked when the registration is inserted
     */
    insertRegistration(newRegistration, successCallback) {
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
    updateRegistration(registrationId, registrationPatch, successCallback = ()=>{}) {
        $.ajax('/services/registrations/' + registrationId, {
                method: 'PATCH',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(registrationPatch),
                headers: {
                    'Authorization': 'Bearer ' + this.sessionId
                }
            })
            .done((data, status, xhr) => {
                if (xhr.status === 200) {

                    // PATCH doesn't send back the registration so we fake it by
                    // copying the registration in the page and updating the attending
                    // property.
                    const registration = Object.assign({}, registrationPatch);
                    successCallback(registration);

                } else {
                    alert('Registration failed. Please try again');
                    console.log(data);
                }
            })
            .fail(handleAjaxFailWithAlert('Registration failed. Please try again'));
    }
}

class AttendingRegistrationsComponent extends React.Component {
    render() {
        const event = this.props.event;
        let attendees = undefined;
        if (event.attendees && event.attendees.length > 0) {
            attendees = event.attendees
                .map((attendee) => <div>{attendee.name}</div>)
        } else {
            attendees = (<div>No attendees yet.</div>);
        }

        let viewAllLink = undefined;
        if (event.registrations.total > 0) {
            viewAllLink = (
                <div>
                    <a href={'/events/' + event.id + '/registrations'}>
                        View All {event.registrations.total} registrations
                    </a>
                </div>);
        }
        return (
            <div>
                {attendees}
                {viewAllLink}
            </div>
        );
    }
}
AttendingRegistrationsComponent.propTypes = {
    event: React.PropTypes.object.isRequired,
}

class RsvpComponent extends React.Component {
    render() {

        const hasRegistration = this.props.hasRegistration;
        const attending = this.props.attending;
        let child = undefined;
        if (this.props.showRsvpForm) {
            child = (
                <div id="attending_question">
                    <h2>Will you attend?</h2>
                    <a href="#" id="attend_yes" className={"btn btn-default " + ((hasRegistration && attending) ? 'btn-success' : '')} role="button" onClick={this.onChangeAttendingYesClick.bind(this)}>Yes</a>
                    <a href="#" id="attend_no" className={"btn btn-default " + ((hasRegistration && !attending) ? 'btn-success' : '')} role="button" onClick={this.onChangeAttendingNoClick.bind(this)}>No</a>
                </div>
            );
        } else {
            let text = undefined;
            if (attending) {
                text = (<div id="attending_confirmed_yes">Yes</div>);
            } else {
                text = (<div id="attending_confirmed_no">No</div>);
            }

            child = (
                <div id="attending_confirmed">
                    <h2>Your RSVP</h2>
                    {text}
                    <div style={{fontSize: '0.9em', paddingTop: '1em'}}>
                        <a href="#" id="attending_change" onClick={this.onShowRsvpFormClick.bind(this)}>Change</a>
                    </div>
                </div>
            );
        }
        return child;
    }
    onChangeAttendingYesClick(e) {
        e.preventDefault();
        if (this.props.onAttendingChange) {
            this.props.onAttendingChange({
                attending: true
            });
        }
    }
    onChangeAttendingNoClick(e) {
        e.preventDefault();
        if (this.props.onAttendingChange) {
            this.props.onAttendingChange({
                attending: false
            });
        }
    }
    onShowRsvpFormClick(e) {
        e.preventDefault();
        if (this.props.onShowRsvpForm) {
            this.props.onShowRsvpForm();
        }
    }
}
RsvpComponent.propTypes = {
    showRsvpForm: React.PropTypes.bool.isRequired,
    attending: React.PropTypes.bool.isRequired,
    hasRegistration: React.PropTypes.bool.isRequired,
    onShowRsvpForm: React.PropTypes.func,
    onAttendingChange: React.PropTypes.func
}

class FeedItemComponent extends React.Component {
    render() {
        const feedItem = this.props.feedItem;
        return (
            <div className='feed-item'>
                <div className='feed-item-header'>
                    <span className='feed-item-name'>{feedItem.createdBy.name}</span>
                    <span className='feed-item-created'>{feedItem.createdDateFormatted + ' ' + feedItem.createdTimeFormatted}</span>
                </div>
                <div className='feed-item-text'>{feedItem.text}</div>
            </div>
        );
    }
}
FeedItemComponent.propTypes = {
    feedItem: React.PropTypes.object.isRequired
}

class FeedComponent extends React.Component {
    render() {
        let children;
        if (this.props.feedItems.length > 0) {
            children = this.props.feedItems.map((feedItem) => <FeedItemComponent feedItem={feedItem} />);
        } else {
            children = (<div>Start chatting about this event</div>);
        }
        return (<div>{children}</div>);
    }
}
FeedComponent.propTypes = {
    feedItems: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
}

class FeedInputComponent extends React.Component {
    render() {
        return (
            <div id="feed-input" style={{borderBottom: '1px solid #CCC'}}>
                <div>Communicate with other about this event. Anyone that has access to this event will see whatever is written.</div>
                <div>
                    <textarea
                        id="feed-item-text"
                        style={{width: '100%', height: '4em'}}
                        onChange={this.onTextChange.bind(this)}
                        value={this.props.feedInput.text} />
                </div>
                <div><button id="feed-input-submit" onClick={this.onPost.bind(this)}>Post</button></div>
            </div>
        );
    }
    onTextChange(e) {
        if (this.props.onFeedInputChange) {
            this.props.onFeedInputChange({
                text: e.target.value
            });
        }
    }
    onPost(e) {
        e.preventDefault();
        const text = this.props.feedInput.text;
        if (text && text.trim().length > 0 && this.props.onFeedItemCreate) {
            this.props.onFeedItemCreate({
                eventId: this.props.eventId,
                text
            });
        }
    }
}
FeedInputComponent.propTypes = {
    feedInput: React.PropTypes.object.isRequired,
    eventId: React.PropTypes.number.isRequired,
    onFeedItemCreate: React.PropTypes.func,
    onFeedInputChange: React.PropTypes.func
}

class EventViewPage {
    /**
     * @param {EventStore} eventStore
     * @param {RegistrationStore} registrationStore
     * @param {EventFeedItemStore} eventFeedItemStore
     */
    constructor(eventStore, registrationStore, eventFeedItemStore, event) {
        this.eventStore = eventStore;
        this.registrationStore = registrationStore;
        this.eventFeedItemStore = eventFeedItemStore;
        this.state = {
            showRsvpForm: !event.myRegistration,
            pendingRegistration: null,
            feedItems: event.feedItems.items,
            event,
            feedInput: {
                text: ''
            }
        };
    }
    init() {
        this.updateView();
        return this;
    }
    updateView() {
        const event = this.state.event;

        ReactDOM.render(
            <AttendingRegistrationsComponent event={event} />,
            document.getElementById('event-registrations-container')
        );

        // if the user has a pending registration or a real registration and either
        // is attending, then we need to make sure the form shows as attending.
        const hasRegistration = this.state.pendingRegistration || !!event.myRegistration;
        const attending = (this.state.pendingRegistration && this.state.pendingRegistration.attending) || 
            (event.myRegistration && event.myRegistration.attending);

        ReactDOM.render(
            <RsvpComponent
                showRsvpForm={this.state.showRsvpForm}
                hasRegistration={hasRegistration}
                attending={attending}
                onShowRsvpForm={this.onShowRsvpForm.bind(this)}
                onAttendingChange={this.onAttendingChange.bind(this)} />,
            document.getElementById('rsvp-container')
        );

        ReactDOM.render(
            (<div>
                <h3>Discussion</h3>
                <FeedInputComponent
                    eventId={event.id}
                    feedInput={this.state.feedInput}
                    onFeedInputChange={this.onFeedInputChange.bind(this)}
                    onFeedItemCreate={this.onFeedItemCreate.bind(this)} />
                <FeedComponent feedItems={this.state.feedItems} />
            </div>),
            document.getElementById('feed-container')
        );
        return this;
    }
    onShowRsvpForm() {
        this.state.showRsvpForm = true;
        this.updateView();
    }
    onAttendingChange({attending}) {
        this._upsertRegistration(attending);
    }
    onRegistrationUpdate(registration) {
        // immediately set the state of the page so that the view doesn't
        // have an invalid state for a period of time
        this.state.pendingRegistration = registration;
        this.state.showRsvpForm = false;
        this.updateView();

        // trigger to reload the event state from the server
        this.eventStore.fetchRemote(this.state.event.id, (data) => {
            this.state.event = data;
            this.state.pendingRegistration = null;
            this.state.showRsvpForm = !data.myRegistration;
            this.updateView();
        });
    }
    _upsertRegistration(attending) {
        const eventId = this.state.event.id;
        const registration = this.state.event.myRegistration;
        const registrationId = registration && registration.id;
        const hasRegistration = !!registrationId;
        if (!hasRegistration) {
            // if no registration yet, create one
            
            const newRegistration = {
                eventId,
                attending
            };
            this.registrationStore.insertRegistration(newRegistration, this.onRegistrationUpdate.bind(this));

        } else {
            // update an existing registration
            const registrationPatch = {
                attending
            }
            this.registrationStore.updateRegistration(registrationId, registrationPatch, this.onRegistrationUpdate.bind(this));
        }
    }
    onFeedInputChange(feedInput) {
        this.state.feedInput = Object.assign({}, this.state.feedInput, feedInput);
        this.updateView();
    }
    onFeedItemCreate(newFeedItem) {
        this.eventFeedItemStore.insertFeedItem(newFeedItem, () => {
            this.eventFeedItemStore.fetchAllFromRemote(this.state.event.id, (feedItems) => {
                this.state.feedItems = feedItems.items;
                this.state.feedInput = Object.assign({}, this.state.feedInput, {
                    text: ''
                });
                this.updateView();
            });
        });
    };
}
