/*
Created by Andrew DeChristopher <drew@kiir.us> on 2/6/2017.
 */

// core libraries
const util = require('util');
const cron = require('cron');
const c = require('chalk');
const HashMap = require('hashmap');
const r = require('requestify');

// import configuration
const cfg = require('./cfg');

// custom libraries
const log = require('./log');
const tutil = require('./util');
const msg = require('./msg')(cfg.dev, cfg.backend, cfg.auth, 'matches');

// logging constants
const M = '[' + c.blue('MTCH') + '] ';

// matches export object
let m = {};

// CLASS VARIABLES AND METHODS

// Active match servers
// K: server ip:port combination
// V: match object from match.js
m.active = new HashMap();

// Checks active match servers for match end
m.jobCheckActive = cron.job('*/5 * * * * *', function () {
	if (cfg.debug) {
		log('matches.js -> m.jobCheckActive(' + m.active.count() + ' matches)', 'debug');
	}
	m.active.forEach(function (value, key) {
		let endpoint = util.format(cfg.endpoints.serverQuery, cfg.api, key);
		// log(M + 'checking: ' + key + ' - ' + endpoint);
		r.get(endpoint).then(response => parseStatus(response));
	});
});

// Checks active match servers for match end
m.jobListActive = cron.job('*/45 * * * * *', function () {
	log(M + m.active.count() + ' Running Matches');
});


// Parse API response and verify match end
function parseStatus(response) {
	let si;
	let hostname;
	let ipp;
	let players;
	if (tutil.contains(response.getBody(), '~')) {
		si = response.getBody().split('~');
		ipp = si[0];
		hostname = si[1];
		players = si[2];

		if (cfg.debug) {
			log('matches.js -> m.parseStatus(' + ipp + ', ' + hostname + ', ' + players + ')', 'debug');
		}

		// log('matches.js -> m.parseStatus(' + ipp + ', ' + hostname + ', ' + players + ')', 'debug');

        // Server has restarted, thusly match has ended
		// 108.61.129.168:27015~KIWI::OFF~0
		if (hostname === 'KIWI::OFF' && players === '1' && hostname !== 'KIWI::LIVE') {
			// log(M + 'met criteria');
			// broadcast match over to all players in match
			let thisMatch = m.active.get(ipp);
			let matchid = thisMatch.getMatchID();
			let mplayers = thisMatch.getPlayers();
			// log(M + 'got match info');

			// CHECK CLIENT FOR MATCH OVER MESSAGE SYNTAX!!
			for (let i = 0; i < mplayers.length; i++) {
				msg.reply(mplayers[i].channel, 'mo~' + matchid);
			}

			// log(M + 'sent match over');

			m.active.remove(ipp);
			log(M + '[END] > ' + ipp, 'match');
			if (cfg.debug) {
				log('matches.js -> m.checkActive(' + ipp + ') -> ' + m.active.has(ipp), 'debug');
			}
		}
	}
}

// (boolean) Adds running match to actives
// returns false if already added
// ipp: (string) ip:port combination
// match: (match) match object
m.add = function (ipp, match) {
	log(M + 'Recieved match request: ' + match.getMatchID() + ', ' + match.getMatchIP() + ',  ' + match.getMatchPassword() + ', ' + match.getPlayers());
	if (!m.active.has(ipp)) {
		m.active.set(ipp, match);
		log(M + '[START] > ' + ipp, 'match');

		if (cfg.debug) {
			log('matches.js -> m.add(' + ipp + ') -> true', 'debug');
		}
		return true;
	}
	log(M + 'Match already running on ' + ipp, 'match');
	if (cfg.debug) {
		log('matches.js -> m.add(' + ipp + ') -> false', 'debug');
	}
	return false;
};

// (boolean) Checks if match server has match running
// ipp: (string) ip:port combination
m.checkActive = function (ipp) {
	if (cfg.debug) {
		log('matches.js -> m.checkActive(' + ipp + ') -> ' + m.active.has(ipp), 'debug');
	}
	return m.active.has(ipp);
};

// Start the check active matches cron job
// ENSURE this is run at server init!
// YOU WILL SEE THE MESSAGE! (Hopefully...)
(function () {
	if (cfg.debug) {
		log('matches.js -> m.init()', 'debug');
	}
	m.jobCheckActive.start();
	m.jobListActive.start();
	log(M + 'STARTED JOB -> Check Active Matches');
})();

// Export matches module
module.exports = m;
