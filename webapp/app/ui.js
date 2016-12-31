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
     * Returns a function to handle any errors with the error page.
     * This executes the standard show error page (see this.showErrorPage(...)).
     */
    showErrorPageCurry(res) {
        return err => this.showErrorPage(res, err);
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
    },

    /**
     * Renders a standard page (after log in), with the standard
     * options.
     * @param {Request} req the current Express request
     * @param {Response} res the current Express response
     * @param {String} page the page to be rendered
     * @param {Object} options any options to be passed to the page
     */
    renderStandard(req, res, page, options) {
        return res.render(page, this.withStandardParams(req, options));
    },

    /**
     * When displaying a standard page (after log in), the page needs
     * to have standard parameters added to it. This method adds the
     * standard parameters to the options.
     */
    withStandardParams(req, options) {
        return Object.assign({
            contextUser: req.user
        }, options);
    }
};