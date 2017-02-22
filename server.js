/*
Created by Andrew DeChristopher <drew@kiir.us> on 4/22/2016.

TODO Roll over the Player class to the user factory <-

GOODLUCK
PRAY FOR
NO CRASH
*/

// core libraries
const os = require('os');
const util = require('util');

// talonPanel libraries
let server = require('http');
const app = require('express')();
// const io = require('socket.io')(server);
const bodyParser = require('body-parser');

// npm libraries
const cron = require('cron');
const datetime = require('node-datetime');
const lupus = require('lupus');
const redis = require('redis');
const requestify = require('requestify');
const c = require('chalk');

// datadog api
const metrics = require('datadog-metrics');

// data storage
let d = require('./modules/data');

// import configuration
const pkg = require('./package.json');
const cfg = require('./modules/cfg');

// custom libraries
const tutil = require('./modules/util');
const flist = require('./modules/flist');
const Player = require('./modules/player');
// const user = require('./modules/user');
// const match = require('./modules/match');
// const matches = require('./modules/matches');
const log = require('./modules/log');
// const sms = require('./modules/sms');
let msg = require('./modules/msg');

// Define ERRORS and other constants
const ERROR_NO_FWIP_FILE = '[' + c.red('ERROR') + '] Given ip file does not exist: ';
const ERROR_NO_SERV_FILE = '[' + c.red('ERROR') + '] Given servers file does not exist: ';
const TALN = '[' + c.magenta('TALN') + '] ';
const SRV = '[' + c.cyan('S') + '] ';
const TP = '[' + c.blue('TALP') + '] ';
const Q = '[' + c.green('Q') + '] ';
const HB = '[' + c.yellow('HB') + '] ';
const HBC = '[' + c.yellow('HBC') + '] ';
const ANNO = '[' + c.magenta('A') + '] ';
const LOGIN = '[' + c.green('LOGIN') + '] ';
const LOGOUT = '[' + c.magenta('LOGOUT') + '] ';

// Initialize datadog metrics
metrics.init({
	host: 'talon',
	prefix: 'talon.'
});

// Populate server pool and connect to REDIS
if (process.argv.length > 2) {
	if (process.argv[2] === 'dev') {
		log(TALN + 'D E V E L O P M E N T    M O D E');
		cfg.region = 0;
		flist.fill(cfg.servers[cfg.region], d.servers, d.totS, 'Servers', ERROR_NO_SERV_FILE);
		cfg.backend = cfg.backendDev;
		cfg.dev = true;
		cfg.firewallEnabled = false;
	} else {
		flist.fill(cfg.servers[cfg.region], d.servers, d.totS, 'Servers', ERROR_NO_SERV_FILE);
	}
	if (process.argv[2] === 'nofw') {
		cfg.firewallEnabled = false;
	}
} else {
	flist.fill(cfg.servers[cfg.region], d.servers, d.totS, 'Servers', ERROR_NO_SERV_FILE);
}

// Update total servers number
d.totS = d.servers.size();

// Populate allowed panel IPs from list
flist.fill('conf/ips.txt', d.firewallIPs, d.totIP, 'Firewall IPs', ERROR_NO_FWIP_FILE);

// Placeholder variable for redis connection
let inm = redis.createClient(6379, cfg.backend);

// Auth with redis
if (cfg.dev === false) {
	inm.auth(cfg.auth);
}

log(TALN + 'TALON v' + pkg.version);
log(TALN + 'Connecting to backend...');

let retryConnect = cron.job('*/2 * * * * *', function () {
	if (d.connectRet === 5) {
		log(TALN + 'FAILED TO CONNECT TO BACKEND!');
		log(TALN + 'Shutting down...');
		throw new Error('FAILED TO CONNECT TO BACKEND!');
	}
	log(TALN + 'Connecting to backend...');
	d.connectRet++;
});

retryConnect.start();

inm.on('connect', function () {
	if (!d.connectYet) {
        // Begin...
		process.title = 'TALON BACKEND v' + pkg.version;
		tutil.ascii();
		log(TALN + 'Copyright 2015-2017 KIWI GAMING (of Kiirus Technologies Inc.)');

        // log('Connected!');
		retryConnect.stop();
        // Start timers and program loop
		startLoop();
		d.connectYet = true;
	}
});

// Subscribe local talon redis client to global message queue
inm.on('subscribe', function (channel, count) {
	d.pList.set('talon', new Player('talon', 'STEAM_0:1:39990', 'ThIsIsAcHaNnElId'));
	log(TALN + 'Connected! Listening: ' + channel + ' (' + count + ')' + os.EOL);
});

// Handles basic timeout errors. Needs work...
inm.on('error', function (error) {
	console.log(error);
});

// Run this callback every time a message is received from a client
inm.on('message', function (channel, message) {
    // Split the message into parts
	let parts = message.split('￮');
	let chan = parts[0];
	let sid = parts[1];
	let from = parts[2];
	let command = parts[3];

    // Send message to be parsed
	if (command === '') {
		log('NULL: ' + channel + ' -> ' + from);
	} else {
		parse(chan, sid, from, command);
	}
});

// Reports relevant app metrics to datadog
let reportMetrics = cron.job('*/5 * * * * *', function () {
	let memUsage = process.memoryUsage();
	metrics.gauge('sys.memory', memUsage.rss);
	metrics.gauge('players.online', d.pList.count());
	metrics.gauge('players.queued', d.qList.count());
	metrics.gauge('servers.count', d.onlServers.size());
});

// Unused debug BS
// let showOnline = cron.job('*/15 * * * * *', function () {
// 	log('[P] (Q: ' + d.currQ + ' / O: ' + d.pList.count() + ')');
// });

// Checks player and server statuses every 10 seconds and
// pops the queue if 10 players and >= 1 server is available.
let parseQueue = cron.job('*/10 * * * * *', function () {
    // Updates d.currS and d.currQ
	d.currS = d.onlServers.size();
	d.currQ = d.qList.count();
    // If server are available
	if (d.onlServers.size() >= 1) {
        // and people are queued
		if (d.qList.count() >= cfg.qSize) {
            // Get all queued players and add to a JS array
			let players = d.qList.values();

            // Declare an empty array for the 10 (x) selected players
			let selected = [];

            // Select 10 payers randomly. Store in selected[].
			for (let i = (0 /* + rigIndex */); i < (cfg.qSize); i++) {
				selected[i] = players[tutil.random(0, players.length - 1)];
				let tp = d.qList.search(selected[i]);
				d.qList.remove(tp);
				players = d.qList.values();
			}

            // Pick a random server
			let srvNum = tutil.random(0, d.onlServers.size() - 1);
			let server = d.onlServers.get(srvNum);
			d.onlServers.remove(server);

            // Build API call suffix
            // &p1=ABC&p2=ABC&p3=ABC&p4=ABC&p5=ABC&p6=ABC&p7=ABC&p8=ABC&p9=ABC&p10=ABC&t1n=team_drop&t2n=team_sparks&numPl=5
            // object with generated api call and t1n and t2n
			let call = buildCall(selected);

            // Concatenate the built API call with the required properties to make the full call
			let apiCall = util.format(cfg.endpoints.matchCreate, cfg.api, server, call.gen);
			log(Q + '[POP] Built API call: ' + apiCall, 'mm');

            // Send the API request
			requestify.get(apiCall).then(function (response) {
				let pass = response.getBody();
                // If the call succeeds
				if (pass === 'failed') {
					// Call 911
					log(Q + '[POP] [S] FAILED >> ' + server, 'mm');
				} else {
					// Log everything
					let now = datetime.create().format('m-d-y H:M:S');
					log(Q + '[POP] Match created @ ' + now, 'mm');
					log(Q + '[POP] [S] >> ' + server + ' : ' + pass, 'mm');
                    // Pop the queue for all selected players
					for (let k = 0; k < selected.length; k++) {
						log(Q + '[POP] [P] >> ' + selected[k].channel + ' - ' + selected[k].sid + ' - ' + selected[k].nm, 'mm');
						reply(selected[k].channel, 'p~' + server + '~' + pass);
					}
				}
			});

            // Update d.currQ to reflect queue pop
			d.currQ = d.qList.count();
		} else {
			log(Q + '(S: ' + d.currS + '/' + d.totS + ') :: (P: ' + d.currQ + '/' + cfg.qSize + ') --> Waiting...', 'mm');
		}
	} else {
		log(Q + '(S: ' + d.currS + '/' + d.totS + ') :: (P: ' + d.currQ + '/' + cfg.qSize + ') --> No servers!', 'mm');
	}
});

// Checks server status every 5 seconds for matches still
// going on and adds/removes them from d.onlServers[]
let parseServers = cron.job('*/5 * * * * *', function () {
	d.totS = d.servers.size();
    // log("[S] Server Query...");
    // console.log(d.onlServers);
	lupus(0, d.totS, function (n) {
		let ip = d.servers.get(n);
		let endpoint = util.format(cfg.endpoints.serverQuery, cfg.api, ip);
		requestify.get(endpoint).then(response => parseServerAPIResponse(response));
	}, function () {
        // log("[S] Server Query: DONE", 'srv');
	});
});

// Checks to see if a user has sent heartbeats in the past
// 30 seconds. If not, removes them from d.qList and d.hbCheck
//
// PLEASE comment this
let parseHeartbeats = cron.job('*/30 * * * * *', function () {
    // log('[HBC] >> RUNNING...', 'hb');
	let i = 0;
    // Check EVERY user
	d.hbCheck.forEach(function (value, key) {
        // log('Checking ' + key + ' -> ' + value, 'hb');
		if (value === false) {
			if (d.hbChance.has(key)) {
				let chance = d.hbChance.get(key);
				if (chance === 0) {
					d.hbCheck.remove(key);
					d.hbChance.remove(key);
					d.pList.remove(key);
					log(HBC + 'REM >> ' + key, 'hb');
				} else {
					d.hbChance.set(key, chance - 1);
					i++;
				}
			} else {
				d.hbChance.set(key, 2);
			}
			if (d.qList.has(key)) {
				d.qList.remove(key);
				d.currQ = d.qList.count();
				bcast('q~' + d.currQ + '~' + d.currS);
				bcast('l~' + d.currQ + '~' + key);
			}
            // log('[HBC] >> ' + key + ' >> OFFLINE', 'hb');
		} else {
			d.hbCheck.set(key, false);
		}
	});
	log(HBC + '>> OFFENDERS: ' + i, 'hb');
});

// Parse client commands
function parse(channel, sid, from, input) {
    // Instantiate command variable
	let command;
	let p;
	let endpoint;

    // Check if command has args
	if (input.indexOf('□') > -1) {
		let parts = input.split('□');
		command = parts[0];
		// let args = parts[1].split('￭');
	} else {
		command = input;
	}

    // Parse commands
	switch (command) {
        // User logs in
		case 'li':
            // Create player object
			p = new Player(from, sid, channel);
            // log out all other instances of player
			if (d.pList.has(p.nm)) {
				d.pList.remove(p.nm);
				if (d.qList.has(p.nm)) {
					d.qList.remove(p.nm);
					d.currQ = d.qList.count();
				}
			}
            // Then set their playerID and add them to HBC
			d.pList.set(p.nm, p);
			d.hbCheck.set(p.nm, true);
			log(LOGIN + p.nm + ' : [' + p.channel + ' - ' + p.sid + ']', 'auth');
			metrics.increment('talon.user.login');
			break;

            // User logs out
		case 'lo':
            // Pillage their user object
			if (d.pList.has(from)) {
				d.pList.remove(from);
				if (d.qList.has(from)) {
					d.hbCheck.remove(from);
					d.qList.remove(from);
					d.currQ = d.qList.count();
					bcast('q~' + d.currQ + '~' + d.currS);
					bcast('l~' + d.currQ + '~' + from);
				}
				log(LOGOUT + from + ' : [' + channel + ' - ' + sid + ']', 'auth');
			}
			break;

            // pong
		case 'ping':
			log('RESP: pong');
			reply(channel, 'pong');
			break;

            // User heartbeat packet
		case 'hb':
            // Set their HBCheck to true for another 30 seconds
			if (d.pList.has(from)) {
				d.hbCheck.set(from, true);
				log(HB + '>> ' + from + tutil.boolStar(isPlayerInQueue(from)), 'hb');
				reply(channel + '-hb', 'hb');
			}
			break;

            // Return number of queued players
		case 'rq':
            // log("RQ -> " + from);
			reply(channel, 'q~' + d.currQ + '~' + d.currS);
			break;

            // UNIMPLEMENTED
            // https://kiir.us/api.php/?cmd=b&key=<apikey>&sid=(SID)
            /* case "ban":
                requestify.get('https://kiir.us/api.php/?cmd=b&key=<apikey>&sid=STEAM_0:1:32732494').then(function(response) {
                    let r = response.getBody();
                    log("WEB: :" + r.toString() + ":");
                    reply(channel, r.toString());
                });
                break; */

            // User sends queue join/leave request
		case 'queue':
			if (procQueue(from, channel)) {
				bcast('q~' + d.currQ + '~' + d.currS);
				bcast('j~' + d.currQ + '~' + from);
				log(Q + '[+] ' + from, 'mm');
			} else {
				bcast('q~' + d.currQ + '~' + d.currS);
				bcast('l~' + d.currQ + '~' + from);
				log(Q + '[-] ' + from, 'mm');
			}
			break;

            // User requests theirs or another player's stats
		case 'stats':
            // Query stats API
			endpoint = util.format(cfg.endpoints.statsQuery, cfg.api, from);
			requestify.get(endpoint).then(function (response) {
				let r = response.getBody();
                // kr~xp~wins~losses
				let stats = r.split('~');
                // Cackyuhlate shite and send info to client
				reply(channel, 's~' + tutil.rank(stats[1]) + '~KR:  ' + stats[0] + ' (+- 0.1)~XP:  ' + tutil.xptot(stats[1]) + '~' + stats[2] + '~' + stats[3]);
			});
			break;

            // Test basic message replying
		case 'reply':
			reply(channel, 'Talon is replying properly, ' + from + ' [' + channel + ']');
			log('REPLY: ' + channel + ' [' + from + '] -> SENT');
			break;

            // Return unknown command (In other words just echo back message)
		default:
			log('UNKN: --> ' + from + ' : ' + input);
			reply(channel, 'Unknown command \'' + input + '\'');
			break;
	}
}

// Send a single message to one user or channel
function reply(to, msg) {
	let pub = redis.createClient(6379, cfg.backend);

	pub.on('error', function (error) {
		console.log(error);
		reply(to, msg);
	});

	if (!cfg.dev) {
		pub.auth(cfg.auth);
	}
	pub.publish(to, msg);
	pub.quit();
}

// Broadcast to all users and channels
function bcast(msg) {
	let pub = redis.createClient(6379, cfg.backend);
	if (!cfg.dev) {
		pub.auth(cfg.auth);
	}

	let players = d.pList.values();

	for (let i = 0; i < players.length; i++) {
		pub.publish(players[i].channel, msg);
        // log(players[i].channel + "/" + msg);
	}
    // log("BCST: " + msg);
	pub.quit();
}

// Process the queue command
function procQueue(user, channel) {
    // User leaves queue
	if (d.qList.has(user)) {
		d.qList.remove(user);
		d.currQ = d.qList.count();
		log(Q + '[?-] ' + user + ' - ' + channel, 'mm');
		return false;
        // User joins queue
	}
	d.qList.set(user, d.pList.get(user));
	d.currQ = d.qList.count();
	log(Q + '[?+] ' + user + ' - ' + channel, 'mm');
	return true;
}

// Add / remove servers from the available servers
// list based on their hostname, active players and
// online status
function parseServerAPIResponse(response) {
	let r;
	let hostname;
	let ip;
	let players;
	if (tutil.contains(response.getBody(), '~')) {
        // console.log(response.getBody());
		r = response.getBody().split('~');
		ip = r[0];
		hostname = r[1];
		players = r[2];
        // Offline or busy check
        //
        // 108.61.129.168:27015~KIWI::OFF~0
        //
		if (((players !== '1' || tutil.contains(hostname, 'LIVE')) || tutil.contains(response.getBody(), 'offline')) && d.onlServers.contains(ip)) {
			d.onlServers.remove(ip);
			log(SRV + '[-] > ' + ip, 'srv');
		}
        // Online or freshly spawned check
		if (hostname === 'KIWI::OFF' && players === '1' && !d.onlServers.contains(ip) && hostname !== 'KIWI::LIVE') {
			d.onlServers.add(ip);
			log(SRV + '[+] > ' + ip, 'srv');
		}
	} else {
        // console.log(response.getBody());
		r = response.getBody().split('|');
		ip = r[0];
		hostname = '';
		players = '';

		if (d.onlServers.contains(ip)) {
			d.onlServers.remove(ip);
			log(SRV + '[-] > ' + ip, 'srv');
		}
	}

    // console.log('[S] > ' + ip + ' : "' + hostname + '" : ' + players);
    // console.log('[S] Online Servers:', d.onlServers);

	d.currS = d.onlServers.size();
	bcast('q~' + d.currQ + '~' + d.currS);

	if (cfg.displayServers) {
		log('[S] >> AVAILABLE: ' + d.onlServers.length, 'srv');
	}
}

function buildCall(selected) {
	let call = {};
	call.gen = '';
	if (cfg.qSize === 10) {
		for (let j = 1; j <= cfg.qSize; j++) {
			call.gen += '&p' + j + '=' + selected[j - 1].sid;
		}
		call.gen += '&t1n=team_' + selected[0].nm;
		call.gen += '&t2n=team_' + selected[5].nm;
		call.t1n = 'team_' + selected[0].nm;
		call.t2n = 'team_' + selected[5].nm;
	} else if (cfg.qSize === 8) {
		call.gen += '&p1=' + selected[0].sid;
		call.gen += '&p2=' + selected[1].sid;
		call.gen += '&p3=' + selected[2].sid;
		call.gen += '&p4=' + selected[3].sid;
		call.gen += '&p6=' + selected[4].sid;
		call.gen += '&p7=' + selected[5].sid;
		call.gen += '&p8=' + selected[6].sid;
		call.gen += '&p9=' + selected[7].sid;
		call.gen += '&t1n=team_' + selected[0].nm;
		call.gen += '&t2n=team_' + selected[4].nm;
	} else if (cfg.qSize === 6) {
		call.gen += '&p1=' + selected[0].sid;
		call.gen += '&p2=' + selected[1].sid;
		call.gen += '&p3=' + selected[2].sid;
		call.gen += '&p6=' + selected[3].sid;
		call.gen += '&p7=' + selected[4].sid;
		call.gen += '&p8=' + selected[5].sid;
		call.gen += '&t1n=team_' + selected[0].nm;
		call.gen += '&t2n=team_' + selected[3].nm;
	} else if (cfg.qSize === 4) {
		call.gen += '&p1=' + selected[0].sid;
		call.gen += '&p2=' + selected[1].sid;
		call.gen += '&p6=' + selected[2].sid;
		call.gen += '&p7=' + selected[3].sid;
		call.gen += '&t1n=team_' + selected[0].nm;
		call.gen += '&t2n=team_' + selected[2].nm;
	} else if (cfg.qSize === 2) {
		call.gen += '&p1=' + selected[0].sid;
		call.gen += '&p6=' + selected[1].sid;
		call.gen += '&t1n=team_' + selected[0].nm;
		call.gen += '&t2n=team_' + selected[1].nm;
		call.t1n = 'team_' + selected[0].nm;
		call.t2n = 'team_' + selected[1].nm;
	}
	call.gen += '&numPl=' + (cfg.qSize / 2);
	log(Q + 'Generated teams.');
	return call;
}

// Gets most recent announcement every 45 seconds and passes it to sendAnnouncement()
let getAnnouncement = cron.job('*/45 * * * * *', function () {
	let endpoint = util.format(cfg.endpoints.getAnnouncement, cfg.api);
	requestify.get(endpoint).then(response => sendAnnouncement(response.getBody()));
});

// Sends out announcement to all connected clients
function sendAnnouncement(anno) {
	if (d.pList.size() > 1) {
		// Set local announcement variable
		d.announcement = anno;
		// Then broadcast it
		bcast('a~' + anno);
		log(ANNO + '[SENT] ' + anno);
	}
}

// Bool if player is currently in queue
function isPlayerInQueue(name) {
	return d.qList.has(name);
}

// returns a formatted list of '-username [steamid] = [channel] = [hwid]'
// bool refresh to add /refresh in the end of the kick URL
function webPlayerList(refresh) {
	let list = '';
	if (d.pList.count() > 0) {
		d.pList.forEach(function (value, key) {
			let queued = isPlayerInQueue(key);
			if (refresh) {
				list += '<b>-</b> ' + tutil.boolStar(queued) + key + ' ( ' + value.sid + ' || ' + value.channel + ' ) ( <a href=\'http://steamcommunity.com/profiles/' + tutil.sidTo64(value.sid) + '\'>Steam Profile</a> ) [ <a href=\'/kick/' + key + '/refresh\'>KICK</a> ]<br />';
			} else {
				list += '<b>-</b> ' + tutil.boolStar(queued) + key + ' ( ' + value.sid + ' || ' + value.channel + ' ) ( <a href=\'http://steamcommunity.com/profiles/' + tutil.sidTo64(value.sid) + '\'>Steam Profile</a> ) [ <a href=\'/kick/' + key + '\'>KICK</a> ]<br />';
			}
		});
	} else {
		list += '<b>-</b> None online...<br />';
	}
	return list;
}

// Returns formatted list of servers
function webServerList() {
	let list = '[ ';
	let br = 0;
	for (let i = 0; i < d.servers.size(); i++) {
		list += d.servers.get(i);
		if (i === (d.servers.size() - 1)) {
			list += ' ]<br />';
		} else {
			list += ', ';
		}
		br++;
		if (br === 3) {
			list += '<br />';
			br = 0;
		}
	}
	return list;
}

// Put together panel pages based on requested type
function renderPanel(refresh, req) {
	let panel = '<!DOCTYPE html><html><head>' +
        '<title>talonPanel :: Dash</title>';
	if (refresh) {
		panel += '<meta http-equiv=\'Refresh\' content=\'5\'>';
	}
	panel += '<link href=\'https://fonts.googleapis.com/css?family=Exo+2\' rel=\'stylesheet\'>' +
        '<style>body{ -webkit-font-smoothing: antialiased; font-family: \'Exo 2\', sans-serif;} input[type=\'text\']{width: 300px;}</style>' +
        '</head><body>' +
        '<h2>talonPanel</h2><hr><br />' +
        'Total servers: ' + d.totS.toString() + '<br />' + webServerList().toString() + '<br /><hr>' +
        'Online players: ' + d.pList.count() + '<br />' +
        'Queued players: ' + d.qList.count() + '<br /><hr>' +
        '<h3>Players:</h3>' + webPlayerList(refresh).toString() + '<br />' +
        '<hr><h3>Announcement</h3><p>' + d.announcement + '</p>' +
        '<form action=\'/ann\' method=\'post\'><input type=\'text\' name=\'announcement\' value=\'\' placeholder=\'Set announcement message here\'/><input type=\'submit\' name=\'submit\' value=\'Submit\'/></form>' +
        '<hr>TALON v' + pkg.version;
	if (refresh) {
		panel += ' (<a href=\'http://' + req.hostname + ':' + cfg.port + '\'>No refresh</a>)';
	} else {
		panel += ' (<a href=\'http://' + req.hostname + ':' + cfg.port + '/refresh\'>Auto refresh</a>)';
	}
	panel += '</body></html>';
	return panel;
}

// Disconnect player from backend and
// remove from queue if necessary
function webKickPlayer(username) {
	d.pList.remove(username);
	if (isPlayerInQueue(username)) {
		d.qList.remove(username);
	}
	log(TP + '[KICK] ' + username, 'web');
}

// Starts tasks
function startLoop() {
    // showOnline.start();
	parseQueue.start();
	parseServers.start();
	parseHeartbeats.start();
	getAnnouncement.start();
	reportMetrics.start();

    // Starts message listener
	inm.subscribe('talon');

	msg = msg(cfg.dev, cfg.backend, cfg.auth);

	// Init talonPanel server
	server = server.Server(app);

    // Log TP express server start
	server.listen(cfg.port, function () {
		log(TP + 'talonPanel μSrvc started.', 'web');
		log(TP + 'Express server started.', 'web');
        /* db.select(1, function () {
            console.log('[SYS] Connected to database');
        }); */
	});
}

// BEGIN talonPanel shite

// Checks if given IP is in allowed talonPanel IPs.
function firewall(ip) {
	if (cfg.firewallEnabled) {
		return d.firewallIPs.contains(ip);
	}
	return true;
}

// Use body-parser to get POST data from requests
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

// Checks if request IP is allowed to access talonPanel before
// continuing to render talonPanel.
app.use(function (req, res, next) {
	let ip = req.connection.remoteAddress.toString().substring(7, req.connection.remoteAddress.toString().length);
	if (firewall(ip)) {
		next();
	} else {
		log(TP + 'DISALLOWED: ' + ip, 'web');
		res.end();
	}
});

app.get('/', function (req, res, next) {
	try {
		res.send(renderPanel(false, req));
		log(TP + '[' + req.ip + '] GET /', 'web');
		metrics.increment('panel.view.norefresh');
	} catch (err) {
		next(err);
	}
});

app.get('/refresh', function (req, res, next) {
	try {
		res.send(renderPanel(true, req));
		log(TP + '[' + req.ip + '] GET /refresh', 'web');
		metrics.increment('panel.view.refresh');
	} catch (err) {
		next(err);
	}
});

app.get('/kick/:username', function (req, res, next) {
	try {
		let username = req.params.username;
		webKickPlayer(username);
		res.redirect('http://' + req.hostname + ':' + cfg.port);
		log(TP + '[' + req.ip + '] GET /kick/' + username, 'web');
	} catch (err) {
		next(err);
	}
});

app.get('/kick/:username/refresh', function (req, res, next) {
	try {
		let username = req.params.username;
		webKickPlayer(username);
		res.redirect('http://' + req.hostname + ':' + cfg.port + '/refresh');
		log(TP + '[' + req.ip + '] GET /kick/' + username, 'web');
	} catch (err) {
		next(err);
	}
});

app.post('/ann', function (req, res, next) {
	try {
		log(TP + '[' + req.ip + '] POST /ann', 'web');
		let endpoint = util.format(cfg.endpoints.setAnnouncement, cfg.api, req.body.announcement);
		requestify.get(endpoint).then(response => sendAnnouncement(response.getBody()));
		res.redirect('http://' + req.hostname + ':' + cfg.port);
	} catch (err) {
		next(err);
	}
});

// Profit :>
