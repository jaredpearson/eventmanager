'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const hasPerm = require('../../middlewares/hasPerm');
const usersDataSource = require('../../data_sources/users');
const permissionService = require('../../services/permissions_service');
const ui = require('../../ui');

const links = [
    {
        title: 'Users',
        url: '/setup/users',
        permissions: ['manageUsers']
    },
    {
        title: 'Invitations', 
        url: '/setup/invitation',
        permissions: ['manageUsers']
    }
];

router.get('/setup', auth(), (req, res) => {
    const availableLinks = links.filter((link) => permissionService.userHasAllPerms(req.user, link.permissions));

    if (availableLinks.length === 0) {
        return res.sendStatus(404);
    }
    ui.renderStandard(req, res, 'pages/setup/home', {
        links: availableLinks
    });
});

module.exports = {
    router
};
