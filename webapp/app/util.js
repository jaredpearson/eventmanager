'use strict';

module.exports = {

    /**
     * Checks the value if it's an integer. If the value is a string, then it's 
     * converted to a number and checked.
     */
    isInt(value) {
        // TODO: check null, infinity, NaN
        if (typeof value === 'undefined') {
            return false;
        }
        var x = parseFloat(value);
        return Number.isInteger(x);
    }

};
