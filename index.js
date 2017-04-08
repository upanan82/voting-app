'use strict';

require('dotenv').load();

var express = require('express'),
	app = express(),
	routes = require('./app/routes/index.js'),
	passport = require('passport'),
	GitHubStrategy = require('passport-github').Strategy,
	MongoClient = require('mongodb').MongoClient,
	ObjectId = require('mongodb').ObjectID,
	urli = 'mongodb://' + process.env.DB_LOGIN + ':' + process.env.DB_PASS + '@ds113580.mlab.com:13580/freecodecamp_1',
	bodyParser = require('body-parser'),
	session = require('express-session');

require('./app/config/passport')(passport, session, GitHubStrategy, MongoClient, ObjectId, urli);

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use(session({
	secret: process.env.SESSION_KEY,
	resave: false,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

routes(app, passport, session, MongoClient, ObjectId, urli, bodyParser);

// Listen port
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
  	console.log('Node app is running on port', app.get('port'));
});