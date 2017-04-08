'use strict';

var configAuth = require('./auth'),
	idK;

module.exports = function (passport, session, GitHubStrategy, MongoClient, ObjectId, urli) {
	
	passport.serializeUser(function (user, done) {
		if (user && user.length) done(null, user[0]._id);
		else done(null, idK);
	});

	passport.deserializeUser(function (id, done) {
		MongoClient.connect(urli, function(err, db) {
			if (err) return 0;
    		else db.collection('voting-users').find({_id : ObjectId(id.toString())}).toArray(function(err, data) {
    			done(err, data);
    			db.close();
			});
    	});
	});

	passport.use(new GitHubStrategy({
		clientID: configAuth.githubAuth.clientID,
		clientSecret: configAuth.githubAuth.clientSecret,
		callbackURL: configAuth.githubAuth.callbackURL
	}, function (token, refreshToken, profile, done) {
		process.nextTick(function () {
			MongoClient.connect(urli, function(err, db) {
				if (err) return 0;
    			else db.collection('voting-users').find({'github.id' : profile.id}).toArray(function(err, data) {
    				if (err) return done(err);
					if (data && data.length) return done(null, data);
    				else {
    					var list = {
    						id : profile.id,
    						username : profile.username,
    						displayName : profile.displayName,
    						publicRepos : profile._json.public_repos
    					};
    					db.collection('voting-users').insertMany([{github : list}], function (err, docs) {
    						if (err) return 0;
							else idK = docs.ops[0]._id;
							return done(null, docs);
    					});
    				}
    				db.close();
				});
    		});
		});
	}));
};