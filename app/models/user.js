'use strict';

function UserModel(userData) {
    this.id = userData.id;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
}

module.exports = UserModel;