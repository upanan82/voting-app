'use strict';

var path = process.cwd();

module.exports = function (app, passport, session, MongoClient, ObjectId, urli, bodyParser) {
	
	// Authorized or not
	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) return next();
		else res.sendFile(path + '/public/login.html');
	}
	
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.route('/auth/github').get(passport.authenticate('github'));
	app.route('/auth/github/callback').get(passport.authenticate('github', {successRedirect: '/', failureRedirect: '/'}));

	// Include home page
	app.route('/').get(isLoggedIn, function (req, res) {
		res.sendFile(path + '/public/index.html');
	});
	
	// Include new poll page
	app.route('/new').get(isLoggedIn, function (req, res) {
		res.sendFile(path + '/public/new.html');
	});
	
	// Include my poll page
	app.route('/my').get(isLoggedIn, function (req, res) {
		res.sendFile(path + '/public/my.html');
	});

	// Logout
	app.route('/logout').get(function (req, res) {
		req.logout();
		res.redirect('/');
	});
	
	// Include polls page
	app.route('/polls/:query').get(function (req, res) {
		var url = req.url.split('/'),
    		code = url[url.length - 1];
		MongoClient.connect(urli, function(err, db) {
    		if (err) return 0;
    		else db.collection('voting-poll').find({_id : code.toString()}).toArray(function(err, data) {
    			if (err) return 0;
    			else if (data && data.length) res.sendFile(path + '/public/poll.html');
    			else res.redirect('/');
    			db.close();
			});
    	});
	});
	
	// List of polls
	app.post('/start', function(req, res) {
		var arr = [];
		MongoClient.connect(urli, function(err, db) {
			if (err) return 0;
    		else {
    			db.collection('voting-poll').count(function (e, count) {
    				var k = 0;
					if (count && count > 0) {
    					db.collection('voting-poll').find().forEach(function(obj) {
    						if (req.body.ind != '' && req.isAuthenticated()) {
    							if (obj.who == req.session.passport.user) arr.push(obj.title + ',' + obj._id);
    							k++;
    						}
    						else if (req.body.ind == '') {
    							arr.push(obj.title + ',' + obj._id);
    							k++;
    						}
							if (k == count) res.end(arr.toString());
						});
					}
					else res.end('');
					db.close();
    			});
    		}
		});
    });
    
    // Create a new poll
    app.post('/newPoll', function(req, res) {
    	MongoClient.connect(urli, function(err, db) {
    		if (err) return 0;
    		else {
    			var arr = req.body.text,
    				info = {},
    				key = ObjectId().toString();
    			for (var i = 0; i < arr.length; i++)
    				info[arr[i]] = 0;
    			db.collection('voting-poll').insertMany([{
    				'list' : info,
    				'title' : req.body.title,
    				'who' : req.session.passport.user,
    				'whoVoted' : [],
    				'_id' : key
    			}], function (err, docs) {
    				if (err) return 0;
                    else res.end(key.toString());
                    db.close();
                });
            }
        });
    });
    
    // View user name
    app.post('/nameD', function(req, res) {
    	if (req.isAuthenticated()) {
			MongoClient.connect(urli, function(err, db) {
				if (err) return 0;
    			else db.collection('voting-users').find({_id : ObjectId(req.session.passport.user.toString())}).toArray(function(err, data) {
    				if (err) return 0;
    				else if (data && data.length) res.end(data[0].github.displayName);
    				db.close();
				});
    		});
    	}
    	else res.end('Voting App');
    });
    
    // Demonstration of poll
    app.post('/pollPage', function(req, res) {
    	var url = req.headers.referer.split('/'),
    		code = url[url.length - 1],
    		send = '';
    	MongoClient.connect(urli, function(err, db) {
    		if (err) return 0;
    		else db.collection('voting-poll').find({_id : code.toString()}).toArray(function(err, data) {
    			if (err) return 0;
    			else if (data && data.length) {
    				var list = data[0].list,
    					str = '',
    					ind1 = '',
    					ind2 = '';
    				if (req.isAuthenticated()) ind1 = 'OK';
    				if (req.isAuthenticated() && req.session.passport.user == data[0].who) ind2 = 'OK';
    				for (var i in list)
    					str += i + "," + list[i] + ",";
    				str += data[0].title + ',' + ind1 + ',' + ind2;
    				res.end(str);
    			}
    			db.close();
			});
    	});
    });
    
    // Delete poll
    app.post('/remove', function(req, res) {
    	var url = req.headers.referer.split('/'),
    		code = url[url.length - 1];
		MongoClient.connect(urli, function(err, db) {
			if (err) return 0;
    		else db.collection('voting-poll').find({_id : code.toString()}).toArray(function(err, data) {
    			if (err) return 0;
    			else if (req.isAuthenticated() && data && data.length && req.session.passport.user == data[0].who) {
    				db.collection('voting-poll').remove({_id : code.toString()});
    				res.end();
    				db.close();
    			}
    		});
    	});
    });
    
    // Take a vote
    app.post('/poll', function(req, res) {
    	var user = '',
    		ip = user = req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
    		url = req.headers.referer.split('/'),
    		code = url[url.length - 1],
    		arg;
    	if (req.isAuthenticated()) user = req.session.passport.user;
    	else user = ip;
    	MongoClient.connect(urli, function(err, db) {
    		if (err) return 0;
    		else db.collection('voting-poll').find({_id : code.toString()}).toArray(function(err, data) {
    			if (err) return 0;
    			else if (data && data.length) {
    				arg = data[0].whoVoted.find(function(element, index, array) {
    					return element == user;
    				});
    				if (arg == undefined) {
    					var list = data[0].list,
    						str = '',
    						a = '',
    						arr = [],
    						newArr = [],
    						info = {};
    					newArr = data[0].whoVoted;
    					newArr.push(user);
    					if (req.isAuthenticated()) newArr.push(ip);
    					for (var i in list) {
    						if (i == req.body.index) a = 'ok';
    						str += i + "," + list[i] + ",";
    					}
    					arr = str.split(',');
    					arr.pop();
    					for (var i = 0; i < arr.length; i = i + 2)
    						info[arr[i]] = arr[i + 1];
    					if (a != '') info[req.body.index] = info[req.body.index] - 0 + 1;
    					else info[req.body.index] = 1;
    					db.collection('voting-poll').findOneAndUpdate({_id : code.toString()}, { $set: {list : info}});
    					db.collection('voting-poll').findOneAndUpdate({_id : code.toString()}, { $set: {whoVoted : newArr}});
    					res.end();
    				}
    				else res.end('err');
    			}
    			db.close();
			});
    	});
    });
};