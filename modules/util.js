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

module.exports = util;
