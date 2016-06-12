/**
 * Created by Drew on 4/22/2016.
 */

//TODO Roll over the Player class to the user factory

const redis = require("redis");
const moment = require("moment");
const Player = require('./modules/Player');
const user = require('./modules/user');
const ArrayList = require("arraylist");
const HashMap = require("hashmap");
const requestify = require('requestify');
const cron = require('cron');
const datetime = require('node-datetime');
const S = require('string');
const fs = require('fs');

var inm = redis.createClient(6379, "kiir.us");
inm.auth("KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY");

var servers = new ArrayList();
var onlServers = new ArrayList();
//servers.add("beak.tech");
populateServers("conf/na-e.txt", servers);

const displayServers = false;

var currQ = 0;
var currS = 0;
var totS = servers.size();

const qSize = 10;

var pList = new HashMap();
var qList = new HashMap();

var hbCheck = new HashMap();
var hbChance = new HashMap();

log("~ TALON v0.6");

inm.on("subscribe", function(channel, count) {
    pList.set("talon", new Player("talon", "", "this"));
    log("~ Listening: " + channel + "\n");
});

inm.on("message", function(channel, message) {
    var parts = message.split("￮");
    var chan = parts[0];
    var sid = parts[1];
    var from = parts[2];
    var command = parts[3];

    if (command !== '') {
        parse(chan, sid, from, command);
    } else {
        log("NULL: " + channel + " -> " + from);
    }
});

var showOnline = cron.job("*/15 * * * * *", function() {
    var i = 0;
    pList.forEach(function() {
        i++;
    });
    log('[P] (Q: ' + currQ + ' / O: ' + i + ')');
});

//Checks player and server statuses every 10 seconds and
//pops the queue if 10 players and >= 1 server is available.
var parseQueue = cron.job("*/10 * * * * *", function() {
    currS = onlServers.size();
    currQ = qList.count();
    if (onlServers.size() >= 1) {
        if (qList.count() >= qSize) {
            var players = qList.values();
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
            //https://kiir.us/api.php/?key=2F6E713BD4BA889A21166251DEDE9&cmd=q&rcon=q&ip={SERVER}&p1=ABC&p2=ABC&p3=ABC&p4=ABC&p5=ABC&p6=ABC&p7=ABC&p8=ABC&p9=ABC&p10=ABC&t1n=team_drop&t2n=team_sparks&numPl=5
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

            var apiCall = "https://kiir.us/api.php/?key=2F6E713BD4BA889A21166251DEDE9&cmd=q&rcon=q&ip=" + server + call;
            log("[Q]->> Built API call: " + apiCall);

            requestify.get(apiCall).then(function(response) {
                var pass = response.getBody();
                if (pass != "failed") {
                    log('[Q]->> Server spawn COMPLETE >> ' + server + ' : ' + pass);
                    for (var k = 0; k < selected.length; k++) {
                        log('POP >>' + selected[k].channel);
                        reply(selected[k].channel, "p~" + server + "~" + pass);
                    }
                } else {
                    log('[Q]->> Server spawn FAILED >> ' + server);
                }
            });

            currQ = qList.count();
        } else {
            log('[Q]{S: ' + currS + '/' + totS + '}(P: ' + currQ + '/' + qSize + ')->> Waiting for players');
        }
    } else {
        log('[Q]{S: ' + currS + '/' + totS + '}(P: ' + currQ + '/' + qSize + ')->> No servers');
    }
});

//Checks server status every 3 seconds for matches still
//going on and adds/removes them from onlServers[]
var parseServers = cron.job("*/3 * * * * *", function() {
    for (var i = 0; i < totS; i++) {
        var ip = servers.get(i);
        //Get hostname and ÷≥≥players
        requestify.get('https://kiir.us/api.php/?key=2F6E713BD4BA889A21166251DEDE9&ip=' + ip + '&cmd=both').then(response => parseServerAPIResponse(response));
    }
});

//Checks to see if a user has sent heartbeats in the past
//30 seconds. If not, removes them from qList and hbCheck
var parseHeartbeats = cron.job("*/30 * * * * *", function() {
    //log('[HBC] >> RUNNING...');
    var i = 0;
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
                    log('[HBC] REM >> ' + key);
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
    log('[HBC] >> OFFENDERS: ' + i);
});

function parse(channel, sid, from, input) {

    var command;

    if (input.indexOf('□') > -1) {
        var parts = input.split('□');
        command = parts[0];
        var args = parts[1].split('￭');
    } else {
        command = input;
    }

    switch (command) {
        case "li":
            var p = new Player(from, sid, channel);
            if (pList.has(p.nm)) {
                pList.remove(p.nm);
                if (qList.has(p.nm)) {
                    qList.remove(p.nm);
                    currQ = qList.count();
                }
            }
            pList.set(p.nm, p);
            hbCheck.set(p.nm, true);
            log("PLYR: --> " + p.nm + ":[" + p.channel + " - " + p.sid + "] created.");
            break;

        case "lo":
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

        case "ping":
            log("RESP: pong");
            reply(channel, "pong");
            break;

        case "hb":
            if (pList.has(from)) {
                hbCheck.set(from, true);
                log("RESP: " + from + " > hb");
                reply(channel + "-hb", "hb");
            }
            break;

            //Return number of queued players
        case "rq":
            log("RQ -> " + from);
            reply(channel, "q~" + currQ + "~" + currS);
            break;

            //https://kiir.us/api.php/?cmd=b&key=2F6E713BD4BA889A21166251DEDE9&sid=(SID)
        case "ban":
            requestify.get('https://kiir.us/api.php/?cmd=b&key=2F6E713BD4BA889A21166251DEDE9&sid=STEAM_0:1:32732494').then(function(response) {
                var r = response.getBody();
                log("WEB: :" + r.toString() + ":");
                reply(channel, r.toString());
            });
            break;

        case "queue":
            if (procQueue(from, channel)) {
                bcast("q~" + currQ + "~" + currS);
                bcast("j~" + currQ + "~" + from);
                log("RESP: " + from + " > qj");
            } else {
                bcast("q~" + currQ + "~" + currS);
                bcast("l~" + currQ + "~" + from);
                log("RESP: " + from + " > ql");
            }
            break;

        case "stats":
            requestify.get('https://kiir.us/api.php/?cmd=stats&key=2F6E713BD4BA889A21166251DEDE9&name=' + from).then(function(response) {
                var r = response.getBody();
                //kr~xp~wins~losses
                var stats = r.split('~');
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
    var pub = redis.createClient(6379, "kiir.us");
    pub.auth("KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY");
    pub.publish(to, msg);
    pub.quit();
}

//Broadcast to all users and channels
function bcast(msg) {
    var pub = redis.createClient(6379, "kiir.us");
    pub.auth("KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY");

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
    var pub = redis.createClient(6379, "kiir.us");
    pub.auth("KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY");

    var players = pList.values();

    for (var i = 0; i < players.length; i++) {
        var p = players[i];
        if (p != ex) {
            pub.publish(p.channel, msg);
        }
    }
    pub.quit();
}

function procQueue(user, channel) {
    //User leaves queue
    if (qList.has(user)) {
        qList.remove(user);
        currQ = qList.count();
        log('QUEUE: >> ' + user + ' >> left');
        return false;
        //User joins queue
    } else {
        qList.set(user, pList.get(user));
        currQ = qList.count();
        log('QUEUE: >> ' + user + ' >> joined');
        return true;
    }
}

function parseServerAPIResponse(response) {
    var r, hostname, ip, players;
    if (contains(response.getBody(), "~")) {
        //console.log(response.getBody());
        r = response.getBody().split('~');
        ip = r[0];
        hostname = r[1];
        players = r[2];
        //Offline or busy check
        if ((players !== "1" || contains(hostname, "LIVE")) || contains(response.getBody(), "offline") && onlServers.contains(ip)) {
            onlServers.remove(ip);
            console.log('[S] > REMOVED: ' + ip);
        }
        //Online or freshly spawned check
        if (hostname === "KIWI::OFF" && players === "1" && !onlServers.contains(ip) && hostname !== "KIWI :: LIVE") {
            onlServers.add(ip);
            console.log('[S] > ADDED: ' + ip);
        }
    } else {
        //console.log(response.getBody());
        r = response.getBody().split('|');
        ip = r[0];
        hostname = "";
        players = "";

        if (onlServers.contains(ip)) {
            onlServers.remove(ip);
            console.log('[S] > REMOVED: ' + ip);
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
            log('FILE:', file, 'DOES NOT EXIST! HALTING');
            process.exit();
        }
    });
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Wraps console.log for printing date in front
function log(message) {
    var dt = datetime.create();
    var time = dt.format('m/d/y H:M:S');
    console.log('[' + time + '] ' + message);
}

//Wrapper for indexOf
function contains(a, b) {
    return S(a).contains(b);
}

//Starts listener
inm.subscribe("talon");

//Starts tasks
//showOnline.start();
parseQueue.start();
parseServers.start();
parseHeartbeats.start();
