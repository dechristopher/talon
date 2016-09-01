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
const ArrayList = require("arraylist");
const cron = require('cron');
const datetime = require('node-datetime');
const fs = require('fs');
const HashMap = require("hashmap");
const lupus = require('lupus');
const moment = require("moment");
const os = require("os");
const redis = require("redis");
const requestify = require('requestify');
const S = require('string');
const gutil = require('gulp-util');

//talonPanel libraries
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

//custom libraries
const player = require('./modules/player');
const user = require('./modules/user');
const log = require('./modules/log');

//Define ERORS and other constants
const ERROR_NO_FWIP_FILE = '[' + gutil.colors.red('ERROR') + '] Given ip file does not exist: ';
const ERROR_NO_SERV_FILE = '[' + gutil.colors.red('ERROR') + '] Given servers file does not exist: ';
const TP = '[' + gutil.colors.blue('TP') + '] ';
const Q = '[' + gutil.colors.green('Q') + '] ';
const HB = '[' + gutil.colors.yellow('HB') + '] ';
const HBC = '[' + gutil.colors.yellow('HBC') + '] ';
const ANNO = '[' + gutil.colors.magenta('A') + '] ';
const LOGIN = '[' + gutil.colors.green('LOGIN') + '] ';
const SRV = '[' + gutil.colors.cyan('S') + '] ';

//The TALON version
const version = "1.1.2";

//Boolean to display all server IPs
//every parseServer tick
const displayServers = false;

//development mode variable
var dev = false;

//redis server address
var backend = "kiir.us";

//Declare queue variables
var currQ = 0;
var currS = 0;

//Set the default queue size
const qSize = 10;

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

var firewallIPs = new ArrayList();

//Total number of servers
var totS = servers.size();

//Populate server pool and connect to REDIS
if (process.argv.length > 2) {
    if (process.argv[2] == "dev") {
        log("~D E V E L O P M E N T    M O D E ~");
        populateServers("conf/dev-servers.txt", servers);
        backend = "beak.tech";
        dev = true;
    } else {
        populateServers("conf/us-e-servers.txt", servers);
    }
} else {
    populateServers("conf/us-e-servers.txt", servers);
}

//declare redis auth code
const auth = "KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY";

//Placeholder variable for redis connection
var inm = redis.createClient(6379, backend);

//Auth with redis
if (dev === false) {
    inm.auth(auth);
}

//Begin...
console.log("\n" +
    " ▄▄▄█████▓ ▄▄▄       ██▓     ▒█████   ███▄    █ \n" +
    " ▓  ██▒ ▓▒▒████▄    ▓██▒    ▒██▒  ██▒ ██ ▀█   █ \n" +
    " ▒ ▓██░ ▒░▒██  ▀█▄  ▒██░    ▒██░  ██▒▓██  ▀█ ██▒\n" +
    " ░ ▓██▓ ░ ░██▄▄▄▄██ ▒██░    ▒██   ██░▓██▒  ▐▌██▒\n" +
    "   ▒██▒ ░  ▓█   ▓██▒░██████▒░ ████▓▒░▒██░   ▓██░\n" +
    "   ▒ ░░    ▒▒   ▓▒█░░ ▒░▓  ░░ ▒░▒░▒░ ░ ▒░   ▒ ▒ \n" +
    "     ░      ▒   ▒▒ ░░ ░ ▒  ░  ░ ▒ ▒░ ░ ░░   ░ ▒░\n" +
    "   ░        ░   ▒     ░ ░   ░ ░ ░ ▒     ░   ░ ░ \n" +
    "                ░  ░    ░  ░    ░ ░           ░ \n\n" +
    " Copyright 2016 Kiirus Technologies Inc."
);

log("~ TALON v" + version);

//Subscribe local talon redis client to global message queue
inm.on("subscribe", function(channel, count) {
    pList.set("talon", new player("talon", "STEAM_0:0:1", "thisisachannelid"));
    log("~ Listening: " + channel + os.EOL);
});

//Run this callback every time a message is received from a client
inm.on("message", function(channel, message) {
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
        if (qList.count() >= qSize) {
            //Get all queued players and add to a JS array
            var players = qList.values();
            //Declare an empty array for the 10 (x) selected players
            var selected = [];
            //Select 10 payers randomly. Store in selected[].
            for (var i = 0; i < qSize; i++) {
                selected[i] = players[random(0, players.length - 1)];
                var tp = qList.search(selected[i]);
                qList.remove(tp);
                players = qList.values();
            }

            //Pick a random server
            var srvNum = random(0, onlServers.size() - 1);
            var server = onlServers.get(srvNum);
            onlServers.remove(server);

            //Build API call
            //https://kiir.us/api.php/?key=2F6E713BD4BA889A21166251DEDE9&cmd=q&rcon=q&ip={SERVER}
            //&p1=ABC&p2=ABC&p3=ABC&p4=ABC&p5=ABC&p6=ABC&p7=ABC&p8=ABC&p9=ABC&p10=ABC&t1n=team_drop&t2n=team_sparks&numPl=5
            var call = "";
            if (qSize == 10) {
                for (var j = 1; j <= qSize; j++) {
                    call += "&p" + j + "=" + selected[j - 1].sid;
                }
                call += "&t1n=team_" + selected[0].nm;
                call += "&t2n=team_" + selected[5].nm;
            } else if (qSize == 8) {
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
            } else if (qSize == 6) {
                call += "&p1=" + selected[0].sid;
                call += "&p2=" + selected[1].sid;
                call += "&p3=" + selected[2].sid;
                call += "&p6=" + selected[3].sid;
                call += "&p7=" + selected[4].sid;
                call += "&p8=" + selected[5].sid;
                call += "&t1n=team_" + selected[0].nm;
                call += "&t2n=team_" + selected[3].nm;
            } else if (qSize == 4) {
                call += "&p1=" + selected[0].sid;
                call += "&p2=" + selected[1].sid;
                call += "&p6=" + selected[2].sid;
                call += "&p7=" + selected[3].sid;
                call += "&t1n=team_" + selected[0].nm;
                call += "&t2n=team_" + selected[2].nm;
            } else if (qSize == 2) {
                call += "&p1=" + selected[0].sid;
                call += "&p6=" + selected[1].sid;
                call += "&t1n=team_" + selected[0].nm;
                call += "&t2n=team_" + selected[1].nm;
            }
            call += "&numPl=" + (qSize / 2);

            //Concatenate the built API call with the required properties to make the full call
            var apiCall = "https://kiir.us/api.php/?key=2F6E713BD4BA889A21166251DEDE9&cmd=q&rcon=q&ip=" + server + call;
            //Log it ... or not
            //log("[Q] [POP] Built API call: " + apiCall);

            //Send the API request
            requestify.get(apiCall).then(function(response) {
                var pass = response.getBody();
                //If the call succeeds
                if (pass != "failed") {
                    //Log everything
                    var now = datetime.create().format('m-d-y H:M:S');
                    log(Q + '[POP] Match created @ ' + now);
                    log(Q + '[POP] [S] >> ' + server + ' : ' + pass);
                    //Pop the queue for all selected players
                    for (var k = 0; k < selected.length; k++) {
                        log(Q + '[POP] [P] >> ' + selected[k].channel + ' - ' + selected[k].steamid + ' - ' + selected[k].nm);
                        reply(selected[k].channel, "p~" + server + "~" + pass);
                    }
                    //Else if the call fails
                } else {
                    //Call 911
                    log(Q + '[POP] [S] FAILED >> ' + server);
                }
            });

            //Update currQ to reflect queue pop
            currQ = qList.count();
        } else {
            log(Q + '{S: ' + currS + '/' + totS + '}(P: ' + currQ + '/' + qSize + ')->> Waiting for players');
        }
    } else {
        log(Q + '{S: ' + currS + '/' + totS + '}(P: ' + currQ + '/' + qSize + ')->> No servers');
    }
});

//Checks server status every 5 seconds for matches still
//going on and adds/removes them from onlServers[]
var parseServers = cron.job("*/5 * * * * *", function() {
    //log("[S] Server Query...");
    //console.log(onlServers);
    lupus(0, totS, function(n) {
        var ip = servers.get(n);
        requestify.get('https://kiir.us/api.php/?key=2F6E713BD4BA889A21166251DEDE9&ip=' + ip + '&cmd=both').then(response => parseServerAPIResponse(response));
    }, function() {
        //log("[S] Server Query: DONE");
    });
    //Old shit that jshint hated
    /*for (var i = 0; i < totS; i++) {
        var ip = servers.get(i);
        //Get hostname and players (ignore JSHint BS)
        requestify.get('https://kiir.us/api.php/?key=2F6E713BD4BA889A21166251DEDE9&ip=' + ip + '&cmd=both').then(response => parseServerAPIResponse(response));
    }*/
});

//Checks to see if a user has sent heartbeats in the past
//30 seconds. If not, removes them from qList and hbCheck
//
//TODO comment this
var parseHeartbeats = cron.job("*/30 * * * * *", function() {
    //log('[HBC] >> RUNNING...');
    var i = 0;
    //Check EVERY user
    hbCheck.forEach(function(value, key) {
        //log('Checking ' + key + ' -> ' + value);
        if (value === false) {
            if (!hbChance.has(key)) {
                hbChance.set(key, 2);
            } else {
                var chance = hbChance.get(key);
                if (chance === 0) {
                    hbCheck.remove(key);
                    hbChance.remove(key);
                    pList.remove(key);
                    log(HBC + 'REM >> ' + key);
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
            //log('[HBC] >> ' + key + ' >> OFFLINE');
        } else {
            hbCheck.set(key, false);
        }
    });
    log(HBC + '>> OFFENDERS: ' + i);
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
            log(LOGIN + p.nm + ":[" + p.channel + " - " + p.sid + "]");
            break;

            //User logs out
        case "lo":
            //Rape && pillage their user object
            if (pList.has(from)) {
                pList.remove(from);
                if (qList.has(from)) {
                    hbCheck.remove(from);
                    qList.remove(from);
                    currQ = qList.count();
                    bcast("q~" + currQ + "~" + currS);
                    bcast("l~" + currQ + "~" + from);
                    log(from + " >> LOG OUT");
                }
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
                log(HB + '>> ' + from);
                reply(channel + "-hb", "hb");
            }
            break;

            //Return number of queued players
        case "rq":
            //log("RQ -> " + from);
            reply(channel, "q~" + currQ + "~" + currS);
            break;

            //UNIMPLEMENTED
            //https://kiir.us/api.php/?cmd=b&key=2F6E713BD4BA889A21166251DEDE9&sid=(SID)
            /*case "ban":
                requestify.get('https://kiir.us/api.php/?cmd=b&key=2F6E713BD4BA889A21166251DEDE9&sid=STEAM_0:1:32732494').then(function(response) {
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
                log(Q + '[+] ' + from);
            } else {
                bcast("q~" + currQ + "~" + currS);
                bcast("l~" + currQ + "~" + from);
                log(Q + '[-] ' + from);
            }
            break;

            //User requests theirs or another player's stats
        case "stats":
            //Query stats API
            requestify.get('https://kiir.us/api.php/?cmd=stats&key=2F6E713BD4BA889A21166251DEDE9&name=' + from).then(function(response) {
                var r = response.getBody();
                //kr~xp~wins~losses
                var stats = r.split('~');
                //Cackyuhlate shite
                var rank = function(xp) {
                    if (xp < 27) {
                        return "♟ Pawn";
                    } else if (xp >= 27 && xp < 45) {
                        return "♙ Pawn+";
                    } else if (xp >= 45 && xp < 70) {
                        return "♞ Knight";
                    } else if (xp >= 70 && xp < 105) {
                        return "♘ Knight+";
                    } else if (xp >= 105 && xp < 136) {
                        return "♝ Bishop";
                    } else if (xp >= 136 && xp < 180) {
                        return "♗ Bishop+";
                    } else if (xp >= 180 && xp < 221) {
                        return "♜ Rook";
                    } else if (xp >= 221 && xp < 270) {
                        return "♖ Rook+";
                    } else if (xp >= 270 && xp < 330) {
                        return "♛ Queen";
                    } else if (xp >= 330 && xp < 420) {
                        return "♕ Queen+";
                    } else if (xp >= 420 && xp < 461) {
                        return "♔ King";
                    } else if (xp >= 461) {
                        return "Ⓛ Legend";
                    }
                };
                var xptot = function(xp) {
                    if (xp < 27) {
                        return xp + " / 27";
                    } else if (xp >= 27 && xp < 45) {
                        return xp + " / 45";
                    } else if (xp >= 45 && xp < 70) {
                        return xp + " / 70";
                    } else if (xp >= 70 && xp < 105) {
                        return xp + " / 205";
                    } else if (xp >= 105 && xp < 136) {
                        return xp + " / 136";
                    } else if (xp >= 136 && xp < 180) {
                        return xp + " / 180";
                    } else if (xp >= 180 && xp < 221) {
                        return xp + " / 221";
                    } else if (xp >= 221 && xp < 270) {
                        return xp + " / 270";
                    } else if (xp >= 270 && xp < 330) {
                        return xp + " / 330";
                    } else if (xp >= 330 && xp < 420) {
                        return xp + " / 420";
                    } else if (xp >= 420 && xp < 461) {
                        return xp + " / 460";
                    } else if (xp >= 461) {
                        return xp;
                    }
                };
                //Send info to client
                reply(channel, "s~" + rank(stats[1]) + "~KR:  " + stats[0] + " (+- 0.1)~XP:  " + xptot(stats[1]) + "~" + stats[2] + "~" + stats[3]);
            });
            break;

            //Test basic message replying
        case "reply":
            reply(channel, "Talon is replying properly, " + from + " [" + channel + "]");
            log("RPLY: " + channel + " [" + from + "] -> " + "SENT");
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
    var pub = redis.createClient(6379, backend);
    if (!dev) {
        pub.auth(auth);
    }
    pub.publish(to, msg);
    pub.quit();
}

//Broadcast to all users and channels
function bcast(msg) {
    var pub = redis.createClient(6379, backend);
    if (!dev) {
        pub.auth(auth);
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
}

//Process the queue command
function procQueue(user, channel) {
    //User leaves queue
    if (qList.has(user)) {
        qList.remove(user);
        currQ = qList.count();
        log(Q + '[?-] ' + user);
        return false;
        //User joins queue
    } else {
        qList.set(user, pList.get(user));
        currQ = qList.count();
        log(Q + '[?+] ' + user);
        return true;
    }
}

//Add / remove servers from the available servers
//list based on their hostname, active players and
//online status
function parseServerAPIResponse(response) {
    var r, hostname, ip, players;
    if (contains(response.getBody(), "~")) {
        //console.log(response.getBody());
        r = response.getBody().split('~');
        ip = r[0];
        hostname = r[1];
        players = r[2];
        //Offline or busy check
        //
        // 108.61.129.168:27015~KIWI::OFF~0
        //
        if (((players !== "1" || contains(hostname, "LIVE")) || contains(response.getBody(), "offline")) && onlServers.contains(ip)) {
            onlServers.remove(ip);
            console.log(SRV + '[-] > ' + ip);
        }
        //Online or freshly spawned check
        if (hostname === "KIWI::OFF" && players === "1" && !onlServers.contains(ip) && hostname !== "KIWI::LIVE") {
            onlServers.add(ip);
            console.log(SRV + '[+] > ' + ip);
        }
    } else {
        //console.log(response.getBody());
        r = response.getBody().split('|');
        ip = r[0];
        hostname = "";
        players = "";

        if (onlServers.contains(ip)) {
            onlServers.remove(ip);
            console.log(SRV + '[-] > ' + ip);z
        }
    }

    //console.log('[S] > ' + ip + ' : "' + hostname + '" : ' + players);
    //console.log('[S] Online Servers:', onlServers);

    currS = onlServers.size();
    bcast("q~" + currQ + "~" + currS);

    if (displayServers) {
        log('[S] >> AVAILABLE: ' + onlServers.length);
    }
}

//Sends out most recent announcement every 45 seconds
var getAnnouncement = cron.job("*/45 * * * * *", function() {
    requestify.get('http://kiir.us/api.php/?cmd=ann&key=2F6E713BD4BA889A21166251DEDE9').then(response => sendAnnouncement(response.getBody()));
});

function sendAnnouncement(announcement) {
    bcast("a~" + announcement);
    log(ANNO + '[SENT] ' + announcement);
}

//Fill the servers[] array with lines from
//a given text file
function populateServers(file, list) {
    fs.exists(file, function(exists) {
        if (exists) {
            fs.readFileSync(file).toString().split('\n').forEach(function(line) {
                if (line !== '') {
                    list.add(line);
                }
            });
            totS = servers.size();
            console.log('FILLED:', list);
        } else {
            throw new Error(ERROR_NO_SERV_FILE + file);
        }
    });
}

//Fill the firewallIPs[] array with lines from
//a given text file
function populateFirewallIPs(file) {
    fs.exists(file, function(exists) {
        if (exists) {
            fs.readFileSync(file).toString().split('\n').forEach(function(line) {
                if (line !== '') {
                    firewallIPs.add(line);
                }
            });
            console.log('FIREWALL IPs:', firewallIPs);
        } else {
            throw new Error(ERROR_NO_FWIP_FILE + file);
        }
    });
}

//Generate a random integer within
//an interval inclusively
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Wrapper for indexOf
//Checks if a string A contains an
//instance of string B
function contains(a, b) {
    return S(a).contains(b);
}

//Bool if player is currently in queue
function isPlayerInQueue(name) {
    return qList.has(name);
}

//Prints an asterisk if bool
function webPrintStar(bool) {
    if (bool) {
        return '*';
    } else {
        return '';
    }
}

//returns a formatted list of '-username [steamid] = [channel] = [hwid]'
//bool refresh to add /refresh in the end of the kick URL
function webPlayerList(refresh) {
    var list = "";
    pList.forEach(function(value, key) {
        var queued = isPlayerInQueue(key);
        if (refresh) {
            list = list + "<b>-</b> " + webPrintStar(queued) + key + " ( " + value.sid + " || " + value.channel + " ) [<a href='/kick/" + key + "/refresh'>KICK</a>]<br />";
        } else {
            list = list + "<b>-</b> " + webPrintStar(queued) + key + " ( " + value.sid + " || " + value.channel + " ) [<a href='/kick/" + key + "'>KICK</a>]<br />";
        }
    });
    return list;
}

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

//Starts message listener
inm.subscribe("talon");

//Starts tasks
//showOnline.start();
parseQueue.start();
parseServers.start();
parseHeartbeats.start();
getAnnouncement.start();

//BEGIN talonPanel shite
var port = 3000;

//app.use(express.static('px'));

/*db.on("error", function (err) {
    log('[ERR] Redis: ' + err);
});*/

server.listen(port, function() {
    log('[TP] talonPanel μSrvc started.');
    log('[TP] Express server started.');
    /*db.select(1, function () {
        console.log('[SYS] Connected to database');
    });*/
});

app.get('/', function(req, res, next) {
    try {
        res.send(
            "<!DOCTYPE html><html><head>" +
            "<title>talonPanel :: Dash</title>" +
            "<link href='https://fonts.googleapis.com/css?family=Exo+2' rel='stylesheet'>" +
            "<style>body{ -webkit-font-smoothing: antialiased; font-family: 'Exo 2', sans-serif;}</style>" +
            "</head><body>" +
            "<h2>talonPanel</h2>" + "<hr><br />" +
            "Total servers: " + totS.toString() + "<br />" + webServerList().toString() + "<br />" +
            "Total players: " + pList.count() + "<br />" +
            "<h3>Players:</h3>" + webPlayerList(false).toString() + "<br />" +
            "<hr>" + "TALON v" + version +
            " (<a href='http:\/\/" + req.hostname + ":" + port + "/refresh'>Auto refresh</a>)" +
            "</body></html>"
        );
        log(TP + '[' + req.ip + '] GET /');
    } catch (e) {
        next(e);
    }
});

app.get('/refresh', function(req, res, next) {
    try {
        res.send(
            "<!DOCTYPE html><html><head>" +
            "<title>talonPanel :: Dash</title>" +
            "<meta http-equiv='Refresh' content='5'>" +
            "<link href='https://fonts.googleapis.com/css?family=Exo+2' rel='stylesheet'>" +
            "<style>body{ -webkit-font-smoothing: antialiased; font-family: 'Exo 2', sans-serif;}</style>" +
            "</head><body>" +
            "<h2>talonPanel</h2>" + "<hr><br />" +
            "Total servers: " + totS.toString() + "<br />" + webServerList().toString() + "<br />" +
            "Total players: " + pList.count() + "<br />" +
            "<h3>Players:</h3>" + webPlayerList(true).toString() + "<br />" +
            "<hr>" + "TALON v" + version +
            " (<a href='http:\/\/" + req.hostname + ":" + port + "'>No refresh</a>)" +
            "</body></html>"
        );
        log(TP + '[' + req.ip + '] GET /refresh');
    } catch (e) {
        next(e);
    }
});

app.get('/kick/:username', function(req, res, next) {
    try {
        var username = req.params.username;
        pList.remove(username);
        res.redirect('http://' + req.hostname + ':' + port);
        log(TP + '[' + req.ip + '] GET /kick/' + username);
        log(TP + '[KICK] ' + username);
    } catch (e) {
        next(e);
    }
});

app.get('/kick/:username/refresh', function(req, res, next) {
    try {
        var username = req.params.username;
        pList.remove(username);
        res.redirect('http://' + req.hostname + ':' + port + '/refresh');
        log(TP + '[' + req.ip + '] GET /kick/' + username);
        log(TP + '[KICK] ' + username);
    } catch (e) {
        next(e);
    }
});

//Profit :>
