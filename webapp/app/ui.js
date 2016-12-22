'use strict';

const _ = require('underscore');

module.exports = {
    showErrorPage(res, err) {
        if (err.stack) {
            console.log(err.stack);
        } else {
            console.log(err || 'Unexpected error occurred');
        }
        res.render('pages/unexpected_error');
    },

    /**
     * Given a string of text, all of the HTML characters are
     * escaped and all new lines are converted to line breaks.
     */
    formatAsHtml(text) {
        if (!text) {
            return text;
        }

        var textAsHtml;

        // escape &, <, >, ", etc
        textAsHtml = _.escape(text);

        // turn line breaks into HTML line breaks
        textAsHtml = textAsHtml.replace(/\n/g, '<br />');

        return textAsHtml;
    }
};