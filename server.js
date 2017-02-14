/*
Created by Andrew DeChristopher <drew@kiir.us> on 4/22/2016.

TODO Roll over the Player class to the user factory

GOODLUCK
TRIFORCE
   ▲
  ▲ ▲
PRAY FOR
NO CRASH
*/

//core libraries
const ArrayList = require('arraylist');
const cron = require('cron');
const datetime = require('node-datetime');
const fs = require('fs');
const HashMap = require('hashmap');
const lupus = require('lupus');
const moment = require('moment');
const os = require('os');
const redis = require('redis');
const requestify = require('requestify');
const gutil = require('gulp-util');
const util = require('util');

//talonPanel libraries
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');

//import configuration
const package = require('./package.json');
const cfg = require('./modules/cfg');

//datadog api
const metrics = require('datadog-metrics');
metrics.init({
    host: 'talon',
    prefix: 'talon.'
});

//custom libraries
const tutil = require('./modules/util');
const flist = require('./modules/flist');
const player = require('./modules/player');
const user = require('./modules/user');
const match = require('./modules/match');
const matches = require('./modules/matches');
const log = require('./modules/log');
const sms = require('./modules/sms');
const msg = require('./modules/msg');

//Define ERRORS and other constants
const ERROR_NO_FWIP_FILE = '[' + gutil.colors.red('ERROR') + '] Given ip file does not exist: ';
const ERROR_NO_SERV_FILE = '[' + gutil.colors.red('ERROR') + '] Given servers file does not exist: ';
const TALN = '[' + gutil.colors.magenta('TALN') + '] ';
const SRV = '[' + gutil.colors.cyan('S') + '] ';
const TP = '[' + gutil.colors.blue('TALP') + '] ';
const Q = '[' + gutil.colors.green('Q') + '] ';
const HB = '[' + gutil.colors.yellow('HB') + '] ';
const HBC = '[' + gutil.colors.yellow('HBC') + '] ';
const ANNO = '[' + gutil.colors.magenta('A') + '] ';
const LOGIN = '[' + gutil.colors.green('LOGIN') + '] ';
const LOGOUT = '[' + gutil.colors.magenta('LOGOUT') + '] ';

//Has already connected
var connectYet = false;

//Number of backend connection retries
var connectRet = 0;

//Local announcement variable
var announcement = '';

//Declare queue variables
var currQ = 0;
var currS = 0;

//Declare HashMaps for all users
//and queued users
var pList = new HashMap();
var qList = new HashMap();

//Declare HashMaps for active users and
//HBC offending users
var hbCheck = new HashMap();
var hbChance = new HashMap();

//Set up the server lists
var servers = new ArrayList();
var onlServers = new ArrayList();

//Allowed talonPanel IPs
var firewallIPs = new ArrayList();

//Total number of servers
var totS = 0;

//Total number of firewall IPs
var totIP = 0;

//Populate server pool and connect to REDIS
if (process.argv.length > 2) {
    if (process.argv[2] == "dev") {
        log(TALN + "D E V E L O P M E N T    M O D E");
        cfg.region = 0;
        flist.fill(cfg.servers[cfg.region], servers, totS, 'Servers', ERROR_NO_SERV_FILE);
        cfg.backend = cfg.backendDev;
        cfg.dev = true;
        cfg.firewallEnabled = false;
    } else {
        flist.fill(cfg.servers[cfg.region], servers, totS, 'Servers', ERROR_NO_SERV_FILE);
    }
    if (process.argv[2] == "nofw") {
        cfg.firewallEnabled = false;
    }
} else {
    flist.fill(cfg.servers[cfg.region], servers, totS, 'Servers', ERROR_NO_SERV_FILE);
}

//Update total servers number
totS = servers.size();

//Populate allowed panel IPs from list
flist.fill('conf/ips.txt', firewallIPs, totIP, 'Firewall IPs', ERROR_NO_FWIP_FILE);

//Placeholder variable for redis connection
var inm = redis.createClient(6379, cfg.backend);

//Auth with redis
if (cfg.dev === false) {
    inm.auth(cfg.auth);
}

log(TALN + 'TALON v' + package.version);

log(TALN + 'Connecting to backend...');

var retryConnect = cron.job("*/2 * * * * *", function() {
    if(connectRet == 5) {
        log(TALN + 'FAILED TO CONNECT TO BACKEND!');
        log(TALN + 'Shutting down...');
        process.exit();
    }
    log(TALN + 'Connecting to backend...');
    connectRet++;
});

retryConnect.start();

inm.on('connect', function() {
    if(!connectYet){
        //Begin...
        process.title = 'TALON BACKEND v' + package.version;

		tutil.ascii();
        log(TALN + 'Copyright 2015-2017 KIWI GAMING (of Kiirus Technologies Inc.)');

        //log('Connected!');
        retryConnect.stop();

        //Start timers and program loop
        startLoop();

        connectYet = true;
    }
});

//Subscribe local talon redis client to global message queue
inm.on('subscribe', function(channel, count) {
    pList.set("talon", new player("talon", "STEAM_0:1:39990", "ThIsIsAcHaNnElId"));
    log(TALN + "Connected! Listening: " + channel + os.EOL);
});

//Handles basic timeout errors. Needs work...
inm.on('error', function(error) {
	console.log(error);
});

//Run this callback every time a message is received from a client
inm.on('message', function(channel, message) {
    //Split the message into parts
    var parts = message.split("￮");
    var chan = parts[0];
    var sid = parts[1];
    var from = parts[2];
    var command = parts[3];

    //Send message to be parsed
    if (command !== '') {
        parse(chan, sid, from, command);
    } else {
        log("NULL: " + channel + " -> " + from);
    }
});

//Reports relevant app metrics to datadog
var reportMetrics = cron.job("*/5 * * * * *", function() {
    var memUsage = process.memoryUsage();
    metrics.gauge('sys.memory', memUsage.rss);
    metrics.gauge('players.online', pList.count());
    metrics.gauge('players.queued', qList.count());
    metrics.gauge('servers.count', onlServers.size());
});

//Unused debug BS
var showOnline = cron.job("*/15 * * * * *", function() {
    log('[P] (Q: ' + currQ + ' / O: ' + pList.count() + ')');
});

//Checks player and server statuses every 10 seconds and
//pops the queue if 10 players and >= 1 server is available.
var parseQueue = cron.job("*/10 * * * * *", function() {
    //Updates currS and currQ
    currS = onlServers.size();
    currQ = qList.count();
    //If server are available
    if (onlServers.size() >= 1) {
        //and people are queued
        if (qList.count() >= cfg.qSize) {
            //Get all queued players and add to a JS array
            var players = qList.values();
            //Declare an empty array for the 10 (x) selected players
            var selected = [];

            //Select and rig teams to favor the KIWI squad ;)
            //var rigIndex = 0;

            /*if (qList.has('drop')) {
                selected[rigIndex] = qList.get('drop');
                qList.remove('drop');
                players = qList.values();
                rigIndex++;
            }

            if (qList.has('Sparks')) {
                selected[rigIndex] = qList.get('Sparks');
                qList.remove('Sparks');
                players = qList.values();
                rigIndex++;
            }

            if (qList.has('Rogean')) {
                selected[rigIndex] = qList.get('Rogean');
                qList.remove('Rogean');
                players = qList.values();
                rigIndex++;
            }

            if (qList.has('twitch')) {
                selected[rigIndex] = qList.get('twitch');
                qList.remove('twitch');
                players = qList.values();
                rigIndex++;
            }

            if (qList.has('otters')) {
                selected[rigIndex] = qList.get('otters');
                qList.remove('otters');
                players = qList.values();
                rigIndex++;
            }*/

            //Select 10 payers randomly. Store in selected[].
            for (var i = (0 /*+ rigIndex*/); i < (cfg.qSize); i++) {
                selected[i] = players[tutil.random(0, players.length - 1)];
                var tp = qList.search(selected[i]);
                qList.remove(tp);
                players = qList.values();
            }

            //Pick a random server
            var srvNum = tutil.random(0, onlServers.size() - 1);
            var server = onlServers.get(srvNum);
            onlServers.remove(server);

            //Build API call
            //https://kiir.us/api.php/?key=<apikey>&cmd=q&rcon=q&ip={SERVER}
            //&p1=ABC&p2=ABC&p3=ABC&p4=ABC&p5=ABC&p6=ABC&p7=ABC&p8=ABC&p9=ABC&p10=ABC&t1n=team_drop&t2n=team_sparks&numPl=5
            var call = "";
            if (cfg.qSize == 10) {
                for (var j = 1; j <= cfg.qSize; j++) {
                    call += "&p" + j + "=" + selected[j - 1].sid;
                }
                call += "&t1n=team_" + selected[0].nm;
                call += "&t2n=team_" + selected[5].nm;
            } else if (cfg.qSize == 8) {
                call += "&p1=" + selected[0].sid;
                call += "&p2=" + selected[1].sid;
                call += "&p3=" + selected[2].sid;
                call += "&p4=" + selected[3].sid;
                call += "&p6=" + selected[4].sid;
                call += "&p7=" + selected[5].sid;
                call += "&p8=" + selected[6].sid;
                call += "&p9=" + selected[7].sid;
                call += "&t1n=team_" + selected[0].nm;
                call += "&t2n=team_" + selected[4].nm;
            } else if (cfg.qSize == 6) {
                call += "&p1=" + selected[0].sid;
                call += "&p2=" + selected[1].sid;
                call += "&p3=" + selected[2].sid;
                call += "&p6=" + selected[3].sid;
                call += "&p7=" + selected[4].sid;
                call += "&p8=" + selected[5].sid;
                call += "&t1n=team_" + selected[0].nm;
                call += "&t2n=team_" + selected[3].nm;
            } else if (cfg.qSize == 4) {
                call += "&p1=" + selected[0].sid;
                call += "&p2=" + selected[1].sid;
                call += "&p6=" + selected[2].sid;
                call += "&p7=" + selected[3].sid;
                call += "&t1n=team_" + selected[0].nm;
                call += "&t2n=team_" + selected[2].nm;
            } else if (cfg.qSize == 2) {
                call += "&p1=" + selected[0].sid;
                call += "&p6=" + selected[1].sid;
                call += "&t1n=team_" + selected[0].nm;
                call += "&t2n=team_" + selected[1].nm;
            }
            call += "&numPl=" + (cfg.qSize / 2);

            //Concatenate the built API call with the required properties to make the full call
            var apiCall = util.format(cfg.endpoints.matchCreate, cfg.api, server, call);
            //log("[Q] [POP] Built API call: " + apiCall, 'mm');

            //Send the API request
            requestify.get(apiCall).then(function(response) {
                var pass = response.getBody();
                //If the call succeeds
                if (pass != "failed") {
                    //Log everything
                    var now = datetime.create().format('m-d-y H:M:S');
                    log(Q + '[POP] Match created @ ' + now, 'mm');
                    log(Q + '[POP] [S] >> ' + server + ' : ' + pass, 'mm');
                    //Pop the queue for all selected players
                    for (var k = 0; k < selected.length; k++) {
                        log(Q + '[POP] [P] >> ' + selected[k].channel + ' - ' + selected[k].sid + ' - ' + selected[k].nm, 'mm');
                        reply(selected[k].channel, "p~" + server + "~" + pass);
                    }
                //Else if the call fails
                } else {
                    //Call 911
                    log(Q + '[POP] [S] FAILED >> ' + server, 'mm');
                }
            });

            //Update currQ to reflect queue pop
            currQ = qList.count();
        } else {
            log(Q + '(S: ' + currS + '/' + totS + ') :: (P: ' + currQ + '/' + cfg.qSize + ') --> Waiting...', 'mm');
        }
    } else {
        log(Q + '(S: ' + currS + '/' + totS + ') :: (P: ' + currQ + '/' + cfg.qSize + ') --> No servers!', 'mm');
    }
});

//Checks server status every 5 seconds for matches still
//going on and adds/removes them from onlServers[]
var parseServers = cron.job("*/5 * * * * *", function() {
    totS = servers.size();
    //log("[S] Server Query...");
    //console.log(onlServers);
    lupus(0, totS, function(n) {
        var ip = servers.get(n);
		var endpoint = util.format(cfg.endpoints.serverQuery, cfg.api, ip);
        requestify.get(endpoint).then(response => parseServerAPIResponse(response));
    }, function() {
        //log("[S] Server Query: DONE", 'srv');
    });
});

//Checks to see if a user has sent heartbeats in the past
//30 seconds. If not, removes them from qList and hbCheck
//TODO comment this
var parseHeartbeats = cron.job("*/30 * * * * *", function() {
    //log('[HBC] >> RUNNING...', 'hb');
    var i = 0;
    //Check EVERY user
    hbCheck.forEach(function(value, key) {
        //log('Checking ' + key + ' -> ' + value, 'hb');
        if (value === false) {
            if (!hbChance.has(key)) {
                hbChance.set(key, 2);
            } else {
                var chance = hbChance.get(key);
                if (chance === 0) {
                    hbCheck.remove(key);
                    hbChance.remove(key);
                    pList.remove(key);
                    log(HBC + 'REM >> ' + key, 'hb');
                } else {
                    hbChance.set(key, chance - 1);
                    i++;
                }
            }
            if (qList.has(key)) {
                qList.remove(key);
                currQ = qList.count();
                bcast("q~" + currQ + "~" + currS);
                bcast("l~" + currQ + "~" + key);
            }
            //log('[HBC] >> ' + key + ' >> OFFLINE', 'hb');
        } else {
            hbCheck.set(key, false);
        }
    });
    log(HBC + '>> OFFENDERS: ' + i, 'hb');
});

//Parse client commands
function parse(channel, sid, from, input) {

    //Instantiate command variable
    var command;

    //Check if command has args
    if (input.indexOf('□') > -1) {
        var parts = input.split('□');
        command = parts[0];
        var args = parts[1].split('￭');
    } else {
        command = input;
    }

    //Parse commands
    switch (command) {
        //User logs in
        case "li":
            //Create player object
            var p = new player(from, sid, channel);
            //log out all other instances of player
            if (pList.has(p.nm)) {
                pList.remove(p.nm);
                if (qList.has(p.nm)) {
                    qList.remove(p.nm);
                    currQ = qList.count();
                }
            }
            //Then set their playerID and add them to HBC
            pList.set(p.nm, p);
            hbCheck.set(p.nm, true);
            log(LOGIN + p.nm + ' : [' + p.channel + ' - ' + p.sid + ']', 'auth');
            metrics.increment('talon.user.login');
            break;

            //User logs out
        case "lo":
            //Pillage their user object
            if (pList.has(from)) {
                pList.remove(from);
                if (qList.has(from)) {
                    hbCheck.remove(from);
                    qList.remove(from);
                    currQ = qList.count();
                    bcast("q~" + currQ + "~" + currS);
                    bcast("l~" + currQ + "~" + from);
                }
				log(LOGOUT + from + ' : [' + channel + ' - ' + sid + ']', 'auth');
            }
            break;

            //pong
        case "ping":
            log("RESP: pong");
            reply(channel, "pong");
            break;

            //User heartbeat packet
        case "hb":
            //Set their HBCheck to true for another 30 seconds
            if (pList.has(from)) {
                hbCheck.set(from, true);
                log(HB + '>> ' + from + tutil.boolStar(isPlayerInQueue(from)), 'hb');
                reply(channel + "-hb", "hb");
            }
            break;

            //Return number of queued players
        case "rq":
            //log("RQ -> " + from);
            reply(channel, "q~" + currQ + "~" + currS);
            break;

            //UNIMPLEMENTED
            //https://kiir.us/api.php/?cmd=b&key=<apikey>&sid=(SID)
            /*case "ban":
                requestify.get('https://kiir.us/api.php/?cmd=b&key=<apikey>&sid=STEAM_0:1:32732494').then(function(response) {
                    var r = response.getBody();
                    log("WEB: :" + r.toString() + ":");
                    reply(channel, r.toString());
                });
                break;*/

            //User sends queue join/leave request
        case "queue":
            if (procQueue(from, channel)) {
                bcast("q~" + currQ + "~" + currS);
                bcast("j~" + currQ + "~" + from);
                log(Q + '[+] ' + from, 'mm');
            } else {
                bcast("q~" + currQ + "~" + currS);
                bcast("l~" + currQ + "~" + from);
                log(Q + '[-] ' + from, 'mm');
            }
            break;

            //User requests theirs or another player's stats
        case "stats":
            //Query stats API
            var endpoint = util.format(cfg.endpoints.statsQuery, cfg.api, from);
            requestify.get(endpoint).then(function(response) {
                var r = response.getBody();
                //kr~xp~wins~losses
                var stats = r.split('~');
                //Cackyuhlate shite and send info to client
                reply(channel, "s~" + tutil.rank(stats[1]) + "~KR:  " + stats[0] + " (+- 0.1)~XP:  " + tutil.xptot(stats[1]) + "~" + stats[2] + "~" + stats[3]);
            });
            break;

            //Test basic message replying
        case "reply":
            reply(channel, "Talon is replying properly, " + from + " [" + channel + "]");
            log("REPLY: " + channel + " [" + from + "] -> " + "SENT");
            break;

            //Return unknown command (In other words just echo back message)
        default:
            log("UNKN: --> " + from + " : " + input);
            reply(channel, "Unknown command '" + input + "'");
            break;
    }
}

//Send a single message to one user or channel
function reply(to, msg) {
    var pub = redis.createClient(6379, cfg.backend);
    if (!cfg.dev) {
        pub.auth(cfg.auth);
    }
    pub.publish(to, msg);
    pub.quit();
}

//Broadcast to all users and channels
function bcast(msg) {
    var pub = redis.createClient(6379, cfg.backend);
    if (!cfg.dev) {
        pub.auth(cfg.auth);
    }

    var players = pList.values();

    for (var i = 0; i < players.length; i++) {
        pub.publish(players[i].channel, msg);
        //log(players[i].channel + "/" + msg);
    }
    //log("BCST: " + msg);
    pub.quit();
}

//Broadcast excluding a single user or channel.
function bcastex(msg, ex) {
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
}

//Process the queue command
function procQueue(user, channel) {
    //User leaves queue
    if (qList.has(user)) {
        qList.remove(user);
        currQ = qList.count();
        log(Q + '[?-] ' + user, 'mm');
        return false;
        //User joins queue
    } else {
        qList.set(user, pList.get(user));
        currQ = qList.count();
        log(Q + '[?+] ' + user, 'mm');
        return true;
    }
}

//Add / remove servers from the available servers
//list based on their hostname, active players and
//online status
function parseServerAPIResponse(response) {
    var r, hostname, ip, players;
    if (tutil.contains(response.getBody(), "~")) {
        //console.log(response.getBody());
        r = response.getBody().split('~');
        ip = r[0];
        hostname = r[1];
        players = r[2];
        //Offline or busy check
        //
        // 108.61.129.168:27015~KIWI::OFF~0
        //
        if (((players !== "1" || tutil.contains(hostname, "LIVE")) || tutil.contains(response.getBody(), "offline")) && onlServers.contains(ip)) {
            onlServers.remove(ip);
            log(SRV + '[-] > ' + ip, 'srv');
        }
        //Online or freshly spawned check
        if (hostname === "KIWI::OFF" && players === "1" && !onlServers.contains(ip) && hostname !== "KIWI::LIVE") {
            onlServers.add(ip);
            log(SRV + '[+] > ' + ip, 'srv');
        }
    } else {
        //console.log(response.getBody());
        r = response.getBody().split('|');
        ip = r[0];
        hostname = "";
        players = "";

        if (onlServers.contains(ip)) {
            onlServers.remove(ip);
            log(SRV + '[-] > ' + ip, 'srv');
        }
    }

    //console.log('[S] > ' + ip + ' : "' + hostname + '" : ' + players);
    //console.log('[S] Online Servers:', onlServers);

    currS = onlServers.size();
    bcast("q~" + currQ + "~" + currS);

    if (cfg.displayServers) {
        log('[S] >> AVAILABLE: ' + onlServers.length, 'srv');
    }
}

function buildCall(selected) {
	let call = '';
	if (cfg.qSize == 10) {
		for (let j = 1; j <= cfg.qSize; j++) {
			call += "&p" + j + "=" + selected[j - 1].sid;
		}
		call += "&t1n=team_" + selected[0].nm;
		call += "&t2n=team_" + selected[5].nm;
	} else if (cfg.qSize == 8) {
		call += "&p1=" + selected[0].sid;
		call += "&p2=" + selected[1].sid;
		call += "&p3=" + selected[2].sid;
		call += "&p4=" + selected[3].sid;
		call += "&p6=" + selected[4].sid;
		call += "&p7=" + selected[5].sid;
		call += "&p8=" + selected[6].sid;
		call += "&p9=" + selected[7].sid;
		call += "&t1n=team_" + selected[0].nm;
		call += "&t2n=team_" + selected[4].nm;
	} else if (cfg.qSize == 6) {
		call += "&p1=" + selected[0].sid;
		call += "&p2=" + selected[1].sid;
		call += "&p3=" + selected[2].sid;
		call += "&p6=" + selected[3].sid;
		call += "&p7=" + selected[4].sid;
		call += "&p8=" + selected[5].sid;
		call += "&t1n=team_" + selected[0].nm;
		call += "&t2n=team_" + selected[3].nm;
	} else if (cfg.qSize == 4) {
		call += "&p1=" + selected[0].sid;
		call += "&p2=" + selected[1].sid;
		call += "&p6=" + selected[2].sid;
		call += "&p7=" + selected[3].sid;
		call += "&t1n=team_" + selected[0].nm;
		call += "&t2n=team_" + selected[2].nm;
	} else if (cfg.qSize == 2) {
		call += "&p1=" + selected[0].sid;
		call += "&p6=" + selected[1].sid;
		call += "&t1n=team_" + selected[0].nm;
		call += "&t2n=team_" + selected[1].nm;
	}
	call += "&numPl=" + (cfg.qSize / 2);
	return call;
}

//Gets most recent announcement every 45 seconds and passes it to sendAnnouncement()
var getAnnouncement = cron.job("*/45 * * * * *", function() {
	var endpoint = util.format(cfg.endpoints.getAnnouncement, cfg.api);
    requestify.get(endpoint).then(response => sendAnnouncement(response.getBody()));
});

//Sends out announcement to all connected clients
function sendAnnouncement(anno) {
	if(pList.size() > 1) {
	    //Set local announcement variable
	    announcement = anno;
	    //Then broadcast it
	    bcast("a~" + anno);
    	log(ANNO + '[SENT] ' + anno);
	}
}

//Bool if player is currently in queue
function isPlayerInQueue(name) {
    return qList.has(name);
}

//returns a formatted list of '-username [steamid] = [channel] = [hwid]'
//bool refresh to add /refresh in the end of the kick URL
function webPlayerList(refresh) {
    var list = "";
    if (pList.count() > 0) {
        pList.forEach(function(value, key) {
            var queued = isPlayerInQueue(key);
            if (refresh) {
                list += "<b>-</b> " + tutil.boolStar(queued) + key + " ( " + value.sid + " || " + value.channel + " ) ( <a href='http://steamcommunity.com/profiles/" + tutil.sidTo64(value.sid) + "'>Steam Profile</a> ) [ <a href='/kick/" + key + "/refresh'>KICK</a> ]<br />";
            } else {
                list += "<b>-</b> " + tutil.boolStar(queued) + key + " ( " + value.sid + " || " + value.channel + " ) ( <a href='http://steamcommunity.com/profiles/" + tutil.sidTo64(value.sid) + "'>Steam Profile</a> ) [ <a href='/kick/" + key + "'>KICK</a> ]<br />";
            }
        });
    } else {
        list += "<b>-</b> None online...<br />";
    }
    return list;
}

//Returns formatted list of servers
function webServerList() {
    var list = '[ ';
    var br = 0;
    for (var i = 0; i < servers.size(); i++) {
        list += servers.get(i);
        if (i != (servers.size() - 1)) {
            list += ', ';
        } else {
            list += ' ]<br />';
        }
        br++;
        if (br == 3) {
            list += '<br />';
            br = 0;
        }
    }
    return list;
}

//Put together panel pages based on requested type
function renderPanel(refresh, req) {
    var panel = "<!DOCTYPE html><html><head>" +
        "<title>talonPanel :: Dash</title>";
    if (refresh) {
        panel += "<meta http-equiv='Refresh' content='5'>";
    }
    panel += "<link href='https://fonts.googleapis.com/css?family=Exo+2' rel='stylesheet'>" +
        "<style>body{ -webkit-font-smoothing: antialiased; font-family: 'Exo 2', sans-serif;} input[type='text']{width: 300px;}</style>" +
        "</head><body>" +
        "<h2>talonPanel</h2>" + "<hr><br />" +
        "Total servers: " + totS.toString() + "<br />" + webServerList().toString() + "<br /><hr>" +
        "Online players: " + pList.count() + "<br />" +
        "Queued players: " + qList.count() + "<br /><hr>" +
        "<h3>Players:</h3>" + webPlayerList(refresh).toString() + "<br />" +
        "<hr>" + "<h3>Announcement</h3>" + "<p>" + announcement + "</p>" +
        "<form action='/ann' method='post'><input type='text' name='announcement' value='' placeholder='Set announcement message here'/><input type='submit' name='submit' value='Submit'/></form>" +
        "<hr>" + "TALON v" + package.version;
    if (refresh) {
        panel += " (<a href='http:\/\/" + req.hostname + ":" + cfg.port + "'>No refresh</a>)";
    } else {
        panel += " (<a href='http:\/\/" + req.hostname + ":" + cfg.port + "/refresh'>Auto refresh</a>)";
    }
    panel += "</body></html>";
    return panel;
}

//Disconnect player from backend and
//remove from queue if necessary
function webKickPlayer(username) {
    pList.remove(username);
    if (isPlayerInQueue(username)) {
        qList.remove(username);
    }
    log(TP + '[KICK] ' + username, 'web');
}

//Starts tasks
function startLoop() {
    //showOnline.start();
    parseQueue.start();
    parseServers.start();
    parseHeartbeats.start();
    getAnnouncement.start();
    reportMetrics.start();

    //Starts message listener
    inm.subscribe("talon");

    //Log TP express server start
    server.listen(cfg.port, function() {
        log(TP + 'talonPanel μSrvc started.', 'web');
        log(TP + 'Express server started.', 'web');
        /*db.select(1, function () {
            console.log('[SYS] Connected to database');
        });*/
    });
}

//BEGIN talonPanel shite

//app.use(express.static('px'));

/*db.on("error", function (err) {
    log('[ERR] Redis: ' + err, 'web');
});*/

//Checks if given IP is in allowed talonPanel IPs.
function firewall(ip) {
    if (cfg.firewallEnabled) {
        return firewallIPs.contains(ip);
    } else {
        return true;
    }
}

//Use body-parser to get POST data from requests
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

//Checks if request IP is allowed to access talonPanel before
//continuing to render talonPanel.
app.use(function(req, res, next) {
    var ip = req.connection.remoteAddress.toString().substring(7, req.connection.remoteAddress.toString().length);
    if (firewall(ip)) {
        next();
    } else {
        log(TP + 'DISALLOWED: ' + ip, 'web');
        res.end();
    }
});

app.get('/', function(req, res, next) {
    try {
        res.send(renderPanel(false, req));
        log(TP + '[' + req.ip + '] GET /', 'web');
        metrics.increment('panel.view.norefresh');
    } catch (e) {
        next(e);
    }
});

app.get('/refresh', function(req, res, next) {
    try {
        res.send(renderPanel(true, req));
        log(TP + '[' + req.ip + '] GET /refresh', 'web');
        metrics.increment('panel.view.refresh');
    } catch (e) {
        next(e);
    }
});

app.get('/kick/:username', function(req, res, next) {
    try {
        var username = req.params.username;
        webKickPlayer(username);
        res.redirect('http://' + req.hostname + ':' + cfg.port);
        log(TP + '[' + req.ip + '] GET /kick/' + username, 'web');
    } catch (e) {
        next(e);
    }
});

app.get('/kick/:username/refresh', function(req, res, next) {
    try {
        var username = req.params.username;
        webKickPlayer(username);
        res.redirect('http://' + req.hostname + ':' + cfg.port + '/refresh');
        log(TP + '[' + req.ip + '] GET /kick/' + username, 'web');
    } catch (e) {
        next(e);
    }
});

app.post('/ann', function(req, res, next) {
    try {
        log(TP + '[' + req.ip + '] POST /ann', 'web');
        var endpoint = util.format(cfg.endpoints.setAnnouncement, cfg.api, req.body.announcement);
        requestify.get(endpoint).then(response => sendAnnouncement(response.getBody()));
        res.redirect('http://' + req.hostname + ':' + cfg.port);
    } catch (e) {
        next(e);
    }
});

//Profit :>
