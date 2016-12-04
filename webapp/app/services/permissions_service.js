'use strict';

/**
 * Checks the user to see if they have all of the 
 * permissions specified in the parameter.
 * @param {Object} user the user
 * @param {Object} user.perms the perms of the user
 * @param {string[]} perms the names of the perms to check
 * @returns {boolean} true when the user has all permissions
 */
function userHasAllPerms(user, perms) {
    if (!perms || perms.length === 0) {
        return true;
    }

    const missingPerms = perms.filter((perm) => {
        return !user.perms || !user.perms[perm];
    });

    if (missingPerms.length > 0) {
        console.log('User is missing permissions', missingPerms);
        return false;
    }
    return true;
}

module.exports = {
    userHasAllPerms
};
