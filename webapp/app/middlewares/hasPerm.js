'use strict';

const permissionService = require('../services/permissions_service');

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
        if (permissionService.userHasAllPerms(req.user, perms)) {
            next();
        } else {
            res.sendStatus(404);
        }

    };

};