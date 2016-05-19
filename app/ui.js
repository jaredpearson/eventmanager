'use strict';

module.exports = {
    showErrorPage: function(res, err) {
        if (err.stack) {
            console.log(err.stack);
        } else {
            console.log(err || 'Unexpected error occurred');
        }
        res.render('pages/unexpected_error');
    }
};