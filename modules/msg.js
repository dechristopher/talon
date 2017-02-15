/*
Created by Andrew DeChristopher <drew@kiir.us> on 2/10/2017.
*/

//Export msg module
module.exports = function(dev, backend, auth) {
	//core libraries
	const redis = require('redis');
	const gutil = require('gulp-util');

	//import configuration
	const log = require('./log');

	//Msg export object
	var msg = {};

	//Send a single message to one user or channel
	msg.reply = function(to, msg) {
	    var pub = redis.createClient(6379, backend);
	    if (!dev) {
	        pub.auth(auth);
	    }
	    pub.publish(to, msg);
	    pub.quit();
	};

	//Broadcast to all users and channels
	msg.bcast = function(msg) {
	    var pub = redis.createClient(6379, backend);
	    if (!dev) {
	        pub.auth(auth);
	    }
	    var players = pList.values();
	    for (var i = 0; i < players.length; i++) {
	        pub.publish(players[i].channel, msg);
	    }
	    pub.quit();
	};

	//Broadcast excluding a single user or channel.
	msg.bcastex = function(msg, ex) {
	    var pub = redis.createClient(6379, backend);
	    if (!dev) {
	        pub.auth(auth);
	    }
	    var players = pList.values();
	    for (var i = 0; i < players.length; i++) {
	        var p = players[i];
	        if (p != ex) {
	            pub.publish(p.channel, msg);
	        }
	    }
	    pub.quit();
	};

	return msg;
};
