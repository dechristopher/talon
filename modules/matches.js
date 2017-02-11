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
const msg = require('./msg');

//logging constants
const M = '[' + gutil.colors.blue('MTCH') + '] ';

//matches export object
var m = {};

//CLASS VARIABLES AND METHODS

//Start the check active matches cron job
//ENSURE this is run at server init
m.init = function() {
	if(cfg.debug) { log('matches.js -> m.init()', 'debug'); }
	m.jobCheckActive.start();
};

//Active match servers
//K: server ip:port combination
//V: match object from match.js
m.active = new HashMap();

//Checks active match servers for match end
m.jobCheckActive = cron.job("*/5 * * * * *", function() {
	if(cfg.debug) { log('matches.js -> m.jobCheckActive(' + m.active.count() + ' matches)', 'debug'); }
	m.active.forEach(function(value, key) {
		r.get('https://kiir.us/api.php/?key=' + cfg.api + '&ip=' + key + '&cmd=both').then(response => parseStatus(response));
	});
});

//Parse API response and verify match end
function parseStatus(response) {
	var r, hostname, ipp, players;
    if (util.contains(response.getBody(), "~")) {
        r = response.getBody().split('~');
        ipp = r[0];
        hostname = r[1];
        players = r[2];

		if(cfg.debug) { log('matches.js -> m.parseStatus(' + ipp + ', ' + hostname + ', ' + players +  ')', 'debug'); }

        //Server has restarted, thusly match has ended
		// 108.61.129.168:27015~KIWI::OFF~0
        if (hostname === "KIWI::OFF" && players === "1" && !onlServers.contains(ip) && hostname !== "KIWI::LIVE") {
            m.active.remove(ipp);
            log(M + '[END] > ' + ipp, 'match');
			if(cfg.debug) { log('matches.js -> m.checkActive(' + ipp + ') -> ' + m.active.has(ipp), 'debug'); }
        }
    }
}

//(boolean) Adds running match to actives
//returns false if already added
//ipp: (string) ip:port combination
//match: (match) match object
m.add = function(ipp, match) {
	if(!m.active.has(ipp)) {
		m.active.set(ipp, match);
		log(M + '[START] > ' + ipp, 'match');
		if(cfg.debug) { log('matches.js -> m.add(' + ipp + ') -> true', 'debug'); }
		return true;
	} else {
		log(M + 'Match already running on ' + ipp, 'match');
		if(cfg.debug) { log('matches.js -> m.add(' + ipp + ') -> false', 'debug'); }
		return false;
	}
};

//(boolean) Checks if match server has match running
//ipp: (string) ip:port combination
m.checkActive = function(ipp) {
	if(cfg.debug) { log('matches.js -> m.checkActive(' + ipp + ') -> ' + m.active.has(ipp), 'debug'); }
	return m.active.has(ipp);
};

//Export matches module
module.exports = m;
