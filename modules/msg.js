/*
Created by Andrew DeChristopher <drew@kiir.us> on 2/10/2017.
*/

//core libraries
const redis = require('redis');
const gutil = require('gulp-util');

//import configuration
const cfg = require('./cfg');
const log = require('./log');

//Msg export object
var msg = {};

//Call this before using
//dev: (boolean) sets cfg.dev variable
msg.init = function(dev) { cfg.dev = dev; };

//Send a single message to one user or channel
msg.reply = function(to, msg) {
    var pub = redis.createClient(6379, cfg.backend);
    if (!cfg.dev) {
        pub.auth(cfg.auth);
    }
    pub.publish(to, msg);
    pub.quit();
};

//Broadcast to all users and channels
msg.bcast = function(msg) {
    var pub = redis.createClient(6379, cfg.backend);
    if (!cfg.dev) {
        pub.auth(cfg.auth);
    }
    var players = pList.values();
    for (var i = 0; i < players.length; i++) {
        pub.publish(players[i].channel, msg);
    }
    pub.quit();
};

//Broadcast excluding a single user or channel.
msg.bcastex = function(msg, ex) {
    var pub = redis.createClient(6379, cfg.backend);
    if (!cfg.dev) {
        pub.auth(cfg.auth);
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
