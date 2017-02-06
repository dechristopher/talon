/**
 * Created by Drew on 4/30/2016.
 */
const redis = require("redis");
const ArrayList = require("arraylist");
const requestify = require('requestify');
const cron = require('cron');
const datetime = require('node-datetime');
const sp = require('stringpad');

//import configuration
const cfg = require('./cfg');

const mon = redis.createClient(6379, "kiir.us");
mon.auth(cfg.auth);
//messages that have been received this second
var mts = 0;
var mtm = 0;
//average messages per second
var mps = 0;
var mpm = 0;

var mpsGraph = "▓";

log("~ TALON Monitor INITIALIZING ~");

mon.on("subscribe", function(channel, count) {
    //Just in case this is necessary, the stub is here
});

mon.on("message", function(channel, message) {
    /*var parts = message.split("￮");
    var chan = parts[0];
    var from = parts[1];
    var command = parts[2];

    if(command != ''){
        parse(chan, from, command);
    }else{
        log("NULL: " + channel + " -> " + from);
    }*/
    //Literally adds to messages this second
    mts++;
    mtm++;
});

function parse(channel, from, input) {
    var command;

    if (input.indexOf('□') > -1) {
        var parts = input.split('□');
        command = parts[0];
        var args = parts[1].split('￭');
    } else {
        command = input;
    }
}

//Refreshes the console every second with up to date data
var refreshScreen = cron.job("*/1 * * * * *", function() {
    //Clear window
    process.stdout.write('\033c');
    //Get current time
    var dt = datetime.create();
    var time = dt.format('H:M:S');
    //Print next window state
    log("╔════════════════ TALON Monitor [" + time + "] ════════════════╗");
    log("║ Listening :                                        talon ║");
    log("║ MSG / Sec :" + sp.left(mps.toFixed(1), 45, ' ') + " ║");
    log("║ MSG / Min :" + sp.left(mpm.toFixed(1), 45, ' ') + " ║");
    log("╠══════╦═══════════════════════════════════════════════════╣");
    log("║ MPS  ║ " + sp.right(mpsGraph, 50, ' ') + "║");
    log("╚══════╩═══════════════════════════════════════════════════╝");
});

//Parses all messages that come in and gets average mps
var parseDataSec = cron.job("*/1 * * * * *", function() {
    var temp = mts;
    mts = 0;

    mps = (mps + temp) / 2;

    if (mps === 0) {
        mpsGraph = "| = 0";
    } else if (mps <= 10) {
        mpsGraph = "▓▓▓▓▓ <=10";
    } else if (mps <= 20) {
        mpsGraph = "▓▓▓▓▓▓▓▓▓▓ <=20";
    } else if (mps <= 30) {
        mpsGraph = "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=30";
    } else if (mps <= 40) {
        mpsGraph = "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=40";
    } else if (mps <= 50) {
        mpsGraph = "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=50";
    } else if (mps <= 60) {
        mpsGraph = "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=60";
    } else if (mps <= 70) {
        mpsGraph = "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=70";
    } else if (mps <= 80) {
        mpsGraph = "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=80";
    } else if (mps <= 90) {
        mpsGraph = "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=90";
    }
});

var parseDataMin = cron.job("00 */1 * * * *", function() {
    var temp = mtm;
    mtm = 0;

    mpm = (mpm + temp) / 2;


});

//Wraps console.log for printing date in front
function log(message) {
    console.log(message);
}

mon.subscribe("talon");
parseDataSec.start();
parseDataMin.start();
refreshScreen.start();
