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

/**
 * middleware that ensures a user has the specified permissions. If the 
 * user doesn't have all of the permissions, then a 404 error is returned.
 * If the request doesn't have the user property, then a 404 error is returned.
 * 
 * @param {...string} the names of the permissions to check the user against
 */
module.exports = function() {
    
    // NodeJS 4 doesn't support ... parameter so using arguments instead
    const perms = Array.prototype.slice.call(arguments);
    
    return (req, res, next) => {
        if (!req.user) {
            console.log('User not found in the request');
            res.sendStatus(404);
            return;
        }

        // check the perms
        if (userHasAllPerms(req.user, perms)) {
            next();
        } else {
            res.sendStatus(404);
        }

    };

};