const log = require('./log');
const gutil = require('gulp-util');
const str = require('string');
const sidconvert = require('steamidconvert')();

const TALN = '[' + gutil.colors.magenta('TALN') + '] ';

//Export object
var util = {};

util.ascii = function() {
	log(TALN);
	log(TALN + ' ▄▄▄█████▓ ▄▄▄       ██▓     ▒█████   ███▄    █ ');
	log(TALN + ' ▓  ██▒ ▓▒▒████▄    ▓██▒    ▒██▒  ██▒ ██ ▀█   █ ');
	log(TALN + ' ▒ ▓██░ ▒░▒██  ▀█▄  ▒██░    ▒██░  ██▒▓██  ▀█ ██▒');
	log(TALN + ' ░ ▓██▓ ░ ░██▄▄▄▄██ ▒██░    ▒██   ██░▓██▒  ▐▌██▒');
	log(TALN + '   ▒██▒ ░  ▓█   ▓██▒░██████▒░ ████▓▒░▒██░   ▓██░');
	log(TALN + '   ▒ ░░    ▒▒   ▓▒█░░ ▒░▓  ░░ ▒░▒░▒░ ░ ▒░   ▒ ▒ ');
	log(TALN + '     ░      ▒   ▒▒ ░░ ░ ▒  ░  ░ ▒ ▒░ ░ ░░   ░ ▒░');
	log(TALN + '   ░        ░   ▒     ░ ░   ░ ░ ░ ▒     ░   ░ ░ ');
	log(TALN + '                ░  ░    ░  ░    ░ ░           ░ ');
	log(TALN);
}

//Generate a random integer within
//an interval inclusively
util.random = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Wrapper for indexOf
//Checks if a string A contains an
//instance of string B
util.contains = function(a, b) {
    return str(a).contains(b);
}

//return steamid64 representation of normal steamid
util.sidTo64 = function(steamid) {
    return sidconvert.convertTo64(steamid);
}

//Returns an asterisk if true
util.boolStar = function(bool) {
    return (bool ? "*" : "");
}

module.exports = util;
