'use strict';

function UserModel(userData) {
    this.id = userData.id;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.name = (userData.firstName + ' ' + userData.lastName).trim();
}

module.exports = UserModel;