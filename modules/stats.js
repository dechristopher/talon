/**
 * Created by Drew on 5/7/2016.
 *
 * Parses stats from matches based on the final backup_round file in the server files.
 */
var redis = require("redis");
var moment = require("moment");
var requestify = require('requestify');
var cron = require('cron');
var datetime = require('node-datetime');
var S = require('string');

var inm = redis.createClient(6379, "kiir.us");
inm.auth("KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY");

var servers = new ArrayList();
servers.add("198.50.130.217:27020");
servers.add("198.50.130.217:27023");

log("~ TALON STATS v0.4");

//TODO WORK...

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
