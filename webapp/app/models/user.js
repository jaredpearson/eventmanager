'use strict';

function UserModel({id, firstName, lastName}) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.name = (firstName + ' ' + lastName).trim();
}

module.exports = UserModel;