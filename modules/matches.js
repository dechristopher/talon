/*
Created by Andrew DeChristopher <drew@kiir.us> on 2/6/2017.
 */

 //core libraries
 const cron = require('cron');
 const gutil = require('gulp-util');
 const HashMap = require('hashmap');
 const r = require('requestify');

//import configuration
const cfg = require('./cfg');

//custom libraries
const log = require('./log');
const util = require('./util');
const match = require('./match');

//logging constants
const M = '[' + gutil.colors.magenta('M') + '] ';

//matches export object
var m = {};

//CLASS VARIABLES AND METHODS

//Start the check active matches cron job
//ENSURE this is run at server init
m.init = function() {
	m.jobCheckActive.start();
};

//Active match servers
//K: server ip:port combination
//V: match object from match.js
m.active = new HashMap();

//Checks active match servers for match end
m.jobCheckActive = cron.job("*/5 * * * * *", function() {
	m.active.forEach(function(value, key) {
		r.get('https://kiir.us/api.php/?key=' + cfg.api + '&ip=' + key + '&cmd=both').then(response => parseStatus(response));
	});
});

//(boolean) Adds running match to actives
//returns false if already added
//ipp: (string) ip:port combination
//match: (match) match object
m.add = function(ipp, match) {
	if(!m.active.has(ipp)) {
		m.active.set(ipp, match);
		log(M + '[START] > ' + ipp, 'match');
		return true;
	} else {
		log(M + 'Match already running on ' + ipp, 'match');
		return false;
	}
};

//(boolean) Checks if match server has match running
//ipp: (string) ip:port combination
m.checkActive = function(ipp) {
	return m.active.has(ipp);
};

module.exports = m;
