/*
Created by Andrew DeChristopher <drew@kiir.us> on 2/10/2017.
*/

// Export msg module
module.exports = function (dev, backend, auth) {
	// core libraries
	const redis = require('redis');
	const c = require('chalk');

	// import configuration
	const log = require('./log');

	// Msg export object
	let m = {};

	// set local variables
	m.dev = dev;
	m.backend = backend;
	m.auth = auth;

	// Send a single message to one user or channel
	m.reply = function (to, msg) {
		let cli = redis.createClient(6379, m.backend);
		if (!m.dev) {
			cli.auth(m.auth);
		}
		cli.publish(to, msg);
		cli.quit();
	};

	// Broadcast to all users and channels
	m.bcast = function (msg, pList) {
		let cli = redis.createClient(6379, m.backend);
		if (!m.dev) {
			cli.auth(m.auth);
		}
		let players = pList.values();
		for (let i = 0; i < players.length; i++) {
			cli.publish(players[i].channel, msg);
		}
		cli.quit();
	};

	// Broadcast excluding a single user or channel.
	m.bcastex = function (msg, ex, pList) {
		let cli = redis.createClient(6379, m.backend);
		if (!m.dev) {
			cli.auth(m.auth);
		}
		let players = pList.values();
		for (let i = 0; i < players.length; i++) {
			let p = players[i];
			if (p !== ex) {
				cli.publish(p.channel, msg);
			}
		}
		cli.quit();
	};

	log('[' + c.yellow('MESG') + '] Messaging initialized');

	return m;
};
