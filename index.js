'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    path = require('path');

var app = express();

app.set('port', (process.env.HTTP_PORT || 5000));

app.use(express.static(path.join(__dirname, 'dist', 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: process.env.SESSION_SECRET || 'whisperwhisper',
    saveUninitialized: false,
    resave: false
}));

// views is directory for all template files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// configure all of the routers
app.use('/', require('./app/routers').router);

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
