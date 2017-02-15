/**
 * Created by Andrew DeChristopher <drew@kiir.us> on 4/30/2016.
 */

const redis = require('redis');
const cron = require('cron');
const clear = require('clear');
const datetime = require('node-datetime');
const sp = require('stringpad');

// import configuration
const cfg = require('./cfg');
const util = require('./util');

const mon = redis.createClient(6379, cfg.backend);
mon.auth(cfg.auth);
// messages that have been received this second
let mts = 0;
let mtm = 0;
// average messages per second
let mps = 0;
let mpm = 0;

let mpsGraph = '▓';

log('~ TALON Monitor INITIALIZING ~');

mon.on('subscribe', function (channel, count) {
    // Just in case this is necessary, the stub is here
	console.log('init', channel, count);
});

mon.on('message', function (channel, message) {
	let parts = message.split('￮');
	let chan = parts[0];
	let from = parts[1];
	let command = parts[2];

	if (command === '') {
		log('NULL: ' + channel + ' -> ' + from);
	} else {
		parse(chan, from, command);
	}

    // Literally adds to messages this second
	mts++;
	mtm++;
});

function parse(channel, from, input) {
	let command;

	if (input.indexOf('□') > -1) {
		let parts = input.split('□');
		command = parts[0];
		// let args = parts[1].split('￭');
	} else {
		command = input;
	}

	util.devnull(command);
}

// Refreshes the console every second with up to date data
let refreshScreen = cron.job('*/1 * * * * *', function () {
    // Clear window
	clear();
    // Get current time
	let dt = datetime.create();
	let time = dt.format('H:M:S');
    // Print next window state
	log('╔════════════════ TALON Monitor [' + time + '] ════════════════╗');
	log('║ Listening :                                        talon ║');
	log('║ MSG / Sec :' + sp.left(mps.toFixed(1), 45, ' ') + ' ║');
	log('║ MSG / Min :' + sp.left(mpm.toFixed(1), 45, ' ') + ' ║');
	log('╠══════╦═══════════════════════════════════════════════════╣');
	log('║ MPS  ║ ' + sp.right(mpsGraph, 50, ' ') + '║');
	log('╚══════╩═══════════════════════════════════════════════════╝');
});

// Parses all messages that come in and gets average mps
let parseDataSec = cron.job('*/1 * * * * *', function () {
	let temp = mts;
	mts = 0;

	mps = (mps + temp) / 2;

	if (mps === 0) {
		mpsGraph = '| = 0';
	} else if (mps <= 10) {
		mpsGraph = '▓▓▓▓▓ <=10';
	} else if (mps <= 20) {
		mpsGraph = '▓▓▓▓▓▓▓▓▓▓ <=20';
	} else if (mps <= 30) {
		mpsGraph = '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=30';
	} else if (mps <= 40) {
		mpsGraph = '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=40';
	} else if (mps <= 50) {
		mpsGraph = '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=50';
	} else if (mps <= 60) {
		mpsGraph = '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=60';
	} else if (mps <= 70) {
		mpsGraph = '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=70';
	} else if (mps <= 80) {
		mpsGraph = '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=80';
	} else if (mps <= 90) {
		mpsGraph = '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <=90';
	}
});

let parseDataMin = cron.job('00 */1 * * * *', function () {
	let temp = mtm;
	mtm = 0;

	mpm = (mpm + temp) / 2;
});

// Wraps console.log for printing date in front
function log(message) {
	console.log(message);
}

mon.subscribe('talon');
parseDataSec.start();
parseDataMin.start();
refreshScreen.start();
