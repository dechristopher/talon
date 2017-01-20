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

module.exports = util;
