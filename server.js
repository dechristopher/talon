/**
 * Created by Drew on 4/22/2016.
 */
var redis = require("redis");
var moment = require("moment");
var Player = require('./Player');
var ArrayList = require("arraylist");
var HashMap = require("hashmap");
var requestify = require('requestify');
var cron = require('cron');
var crypto = require('crypto');
var fmt = require('biguint-format');
var datetime = require('node-datetime');
var S = require('string');

var inm = redis.createClient(6379, "kiir.us");
inm.auth("KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY");

var servers = new ArrayList();
servers.add("198.50.130.217:27020");
servers.add("198.50.130.217:27023");
var onlServers = new ArrayList();

var displayServers = false;

var currQ = 0;
var currS = 0;
var totS = servers.size();

const qSize = 10;

var pList = new HashMap();
var qList = new HashMap();

var hbCheck = new HashMap();
var hbChance = new HashMap();

log("~ TALON v0.4");

inm.on("subscribe", function (channel, count) {
    pList.set("talon", new Player("talon", "this"));
    log("~ Listening: " + channel + "\n");
});

inm.on("message", function (channel, message) {
    var parts = message.split("￮");
    var chan = parts[0];
    var from = parts[1];
    var command = parts[2];

    if(command != ''){
        parse(chan, from, command);
    }else{
        log("NULL: " + channel + " -> " + from);
    }
});

var showOnline = cron.job("*/15 * * * * *", function() {
    var i = 0;
    pList.forEach(function(){
        i++;
    });
    log('[P] (Q: ' + currQ + ' / O: ' + i + ')');
});

//Checks player and server statuses every 15 seconds and
//pops the queue if 10 players and >= 1 server is available.
var parseQueue = cron.job("*/15 * * * * *", function(){
    currS = onlServers.size();
    currQ = qList.count();
    if(onlServers.size() >= 1) {
        if (qList.count() >= qSize) {
            var players = qList.values();
            var selected = [];
            //Select 10 payers randomly. Store in selected[].
            for (var i = 0; i < qSize; i++) {
                selected[i] = players[random(0, players.length-1)];
                var k = qList.search(selected[i]);
                qList.remove(k);
                players = qList.values();
            }

            //Pick a random server
            var srvNum = random(0, onlServers.size()-1);
            var server = onlServers.get(srvNum);
            onlServers.remove(server);

            requestify.get('https://kiir.us/api.php/?key=2F6E713BD4BA889A21166251DEDE9&ip=' + server + "&rcon=q&cmd=q").then(function(response) {
                var pass = response.getBody();
                if(pass != "failed"){
                    log('[Q]->> Server spawn COMPLETE >> ' + server + ' : ' + pass);
                    for (var j = 0; j < selected.length; j++) {
                        log('POP >>' + selected[j]);
                        reply(selected[j], "p~" + server + "~"+ pass);
                    }
                }else{
                    log('[Q]->> Server spawn FAILED >> ' + server);
                }
            });

        }else{
            log('[Q]{S: ' + currS + '/' + totS + '}(P: ' + currQ + '/10)->> Waiting for players');
        }
    }else{
        log('[Q]{S: ' + currS + '/' + totS + '}(P: ' + currQ + '/10)->> No servers');
    }
});

//Checks server status every 30 seconds for matches still
//going on and adds/removes them from onlServers[]
var parseServers = cron.job("*/30 * * * * *", function(){
    for(var i = 0; i < servers.length; i++){
        var ip = servers.get(i);

        //Get hostname and players
        requestify.get('https://kiir.us/api.php/?key=2F6E713BD4BA889A21166251DEDE9&ip=' + ip + '&cmd=both').then(function(response) {
            var r = response.getBody().split('~');
            var ip = r[0];
            var hostname = r[1];
            var players = r[2];

            log('[S] > ' + ip + ' : ' + hostname + ' : ' + players);

            //Offline or busy check
            if((contains(hostname, "offline") || contains(hostname, "LIVE") || (contains(hostname, "NEED") && !contains(hostname, "10"))) && onlServers.contains(ip)){
                onlServers.remove(ip);
                log('[S] > REMOVED: ' + ip);
            }

            //Online or freshly spawned check
            if((hostname == "KIWI :: " || contains(hostname, "NEED 10")) && players == "0" && !onlServers.contains(ip)){
                onlServers.add(ip);
                log('[S] > ADDED: ' + ip);
            }
        });
    }

    currS = onlServers.size();
    bcast("q~" + currQ + "~" + currS);

    if(displayServers){
        log('[S] >> AVAILABLE: ' + onlServers.length);
    }
});

//Checks to see if a user has sent heartbeats in the past
//30 seconds. If not, removes them from qList and hbCheck
var parseHeartbeats = cron.job("*/30 * * * * *", function(){
    //log('[HBC] >> RUNNING...');
    var i = 0;
    hbCheck.forEach(function(value, key){
        //log('Checking ' + key + ' -> ' + value);
        if(value == false){
            if(!hbChance.has(key)){
                hbChance.set(key, 2);
            }else{
                var chance = hbChance.get(key);
                if(chance == 0){
                    hbCheck.remove(key);
                    hbChance.remove(key);
                    log('[HBC] REM >> ' + key);
                }else{
                    hbChance.set(key, chance-1);
                    i++;
                }
            }
            if(qList.has(key)){
                qList.remove(key);
                currQ = qList.count();
                bcast("q~" + currQ + "~" + currS);
                bcast("l~" + currQ + "~" + key);
            }
            //log('[HBC] >> ' + key + ' >> OFFLINE');
        }else{
            hbCheck.set(key, false);
        }
    });
    log('[HBC] >> OFFENDERS: ' + i);
});

function parse(channel, from, input){

    var command;

    if(input.indexOf('□') > -1){
        var parts = input.split('□');
        command = parts[0];
        var args = parts[1].split('￭');
    }else{
        command = input;
    }

    switch(command) {
        //http://kiir.us/api.php/?cmd=l&key=(KEY)&un=(USERNAME)&pw=(PASSWORD)
        case "li":
            var p = new Player(from, channel);
            if(pList.has(p.nm)){
                pList.remove(p.nm);
                if(qList.has(p.nm)){
                    qList.remove(p.nm);
                    currQ = qList.count();
                }
            }
            pList.set(p.nm, p);
            hbCheck.set(p.nm, true);
            log("PLYR: --> "+ p.nm + ":[" + p.channel + "] created.");
            break;

        case "lo":
            if(pList.has(from)){
                pList.remove(from);
                if(qList.has(from)){
                    hbCheck.remove(from);
                    qList.remove(from);
                    currQ = qList.count();
                    bcast("q~" + currQ + "~" + currS);
                    bcast("l~" + currQ + "~" + from);
                }
            }
            break;

        case "ping":
            log("RESP: pong");
            reply(channel, "pong");
            break;

        case "hb":
            if(pList.has(from)){
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
            if(procQueue(from, channel)){
                bcast("q~" + currQ + "~" + currS);
                bcast("j~" + currQ + "~" + from);
                log("RESP: " + from + " > qj");
            }else{
                bcast("q~" + currQ + "~" + currS);
                bcast("l~" + currQ + "~" + from);
                log("RESP: " + from + " > ql");
            }
            break;

        /*case "qwertyuiop":
            console.log("! EXITING THREAD !");
            inm.unsubscribe();
            inm.quit();
            break;*/

        //Test basic message replying
        case "reply":
            reply(channel, "Talon is replying properly, " + from + " [" + channel + "]");
            log("RPLY: " + channel + " ["+ from + "] -> " + "SENT");
            break;

        //Return unknown command (In other words just echo back message)
        default:
            log("UNKN: --> " + from + " : " + input);
            reply(channel, "Unknown command '" + input + "'");
            break;
    }
}

//Send a single message to one user or channel
function reply(to, msg){
    var pub = redis.createClient(6379, "kiir.us");
    pub.auth("KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY");
    pub.publish(to, msg);
    pub.quit();
}

//Broadcast to all users and channels
function bcast(msg){
    var pub = redis.createClient(6379, "kiir.us");
    pub.auth("KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY");

    var players = pList.values();

    for(var i = 0; i < players.length; i++){
        var p = players[i];
        pub.publish(p.channel, msg);
    }
    log("BCST: " + msg);
    pub.quit();
}

//Broadcast excluding a single user or channel.
function bcastex(msg, ex){
    var pub = redis.createClient(6379, "kiir.us");
    pub.auth("KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY");

    var players = pList.values();

    for(var i = 0; i < players.length; i++){
        var p = players[i];
        if(p != ex) {
            pub.publish(p.channel, msg);
        }
    }
    pub.quit();
}

function procQueue(user, channel){
    //User leaves queue
    if(qList.has(user)){
        qList.remove(user);
        currQ = qList.count();
        log('QUEUE: >> ' + user + ' >> left');
        return false;
    //User joins queue
    }else{
        qList.set(user, channel);
        currQ = qList.count();
        log('QUEUE: >> ' + user + ' >> joined');
        return true;
    }
}

function randomC (qty) {
    var x = crypto.randomBytes(qty);
    return fmt(x, 'dec');
}

//function random (low, high) {
 //   return randomC(4) / Math.pow(2,4*8-1) * (high - low) + low;
//}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Wraps console.log for printing date in front
function log(message){
    var dt = datetime.create();
    var time = dt.format('m/d/y H:M:S');
    console.log('[' + time + '] ' + message);
}

//Wrapper for indexOf
function contains (a, b) {
    return S(a).contains(b);
}

//Starts listener
inm.subscribe("talon");

//Starts tasks
showOnline.start();
parseQueue.start();
parseServers.start();
parseHeartbeats.start();