/*
Created by Andrew DeChristopher <drew@kiir.us> on 1/7/2017.
 */

// core libraries
const str = require('string');
const c = require('chalk');
const sidc = require('steamidconvert')();
const rs = require('randomstring');
const log = require('./log');

// logging constants
const TALN = '[' + c.magenta('TALN') + '] ';

// Export object
let util = {};

util.ascii = function () {
	log(TALN);
	log(TALN + c.red(' ▄▄▄█████▓ ') + c.yellow('   ▄▄▄       ') + c.green('   ██▓     ') + c.cyan('   ▒█████   ') + c.blue('   ███▄    █   ') + c.black('       ') + c.magenta('   ▄▄▄██▀▀▀ ') + c.white('    ██████ '));
	log(TALN + c.red(' ▓  ██▒ ▓▒ ') + c.yellow('  ▒████▄     ') + c.green('  ▓██▒     ') + c.cyan('  ▒██▒  ██▒ ') + c.blue('   ██ ▀█   █   ') + c.black('       ') + c.magenta('     ▒██    ') + c.white('  ▒██    ▒ '));
	log(TALN + c.red(' ▒ ▓██░ ▒░ ') + c.yellow('  ▒██  ▀█▄   ') + c.green('  ▒██░     ') + c.cyan('  ▒██░  ██▒ ') + c.blue('  ▓██  ▀█ ██▒  ') + c.black('       ') + c.magenta('     ░██    ') + c.white('  ░ ▓██▄   '));
	log(TALN + c.red(' ░ ▓██▓ ░  ') + c.yellow('  ░██▄▄▄▄██  ') + c.green('  ▒██░     ') + c.cyan('  ▒██   ██░ ') + c.blue('  ▓██▒  ▐▌██▒  ') + c.black('       ') + c.magenta('  ▓██▄██▓   ') + c.white('    ▒   ██▒'));
	log(TALN + c.red('   ▒██▒ ░  ') + c.yellow('   ▓█   ▓██▒ ') + c.green('  ░██████▒ ') + c.cyan('  ░ ████▓▒░ ') + c.blue('  ▒██░   ▓██░  ') + c.black('  ██▓  ') + c.magenta('   ▓███▒    ') + c.white('  ▒██████▒▒'));
	log(TALN + c.red('   ▒ ░░    ') + c.yellow('   ▒▒   ▓▒█░ ') + c.green('  ░ ▒░▓  ░ ') + c.cyan('  ░ ▒░▒░▒░  ') + c.blue('  ░ ▒░   ▒ ▒   ') + c.black('  ▒▓▒  ') + c.magenta('   ▒▓▒▒░    ') + c.white('  ▒ ▒▓▒ ▒ ░'));
	log(TALN + c.red('     ░     ') + c.yellow('    ▒   ▒▒ ░ ') + c.green('  ░ ░ ▒  ░ ') + c.cyan('    ░ ▒ ▒░  ') + c.blue('  ░ ░░   ░ ▒░  ') + c.black('  ░▒   ') + c.magenta('   ▒ ░▒░    ') + c.white('  ░ ░▒  ░ ░'));
	log(TALN + c.red('   ░       ') + c.yellow('    ░   ▒    ') + c.green('    ░ ░    ') + c.cyan('  ░ ░ ░ ▒   ') + c.blue('     ░   ░ ░   ') + c.black('  ░    ') + c.magenta('   ░ ░ ░    ') + c.white('  ░  ░  ░  '));
	log(TALN + c.red('           ') + c.yellow('        ░  ░ ') + c.green('      ░  ░ ') + c.cyan('      ░ ░   ') + c.blue('           ░   ') + c.black('   ░   ') + c.magenta('   ░   ░    ') + c.white('        ░  '));
	log(TALN + c.red('           ') + c.yellow('             ') + c.green('           ') + c.cyan('            ') + c.blue('               ') + c.black('   ░   ') + c.magenta('            ') + c.white('           '));
	log(TALN);
};

// Generate a random integer within
// an interval inclusively
util.random = function (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

util.rString = function (size) {
	return rs.generate(size);
};

// Does absolutely nothing
util.devnull = function (data) {
	return data;
};

// Wrapper for indexOf
// Checks if a string A contains an
// instance of string B
util.contains = function (a, b) {
	return str(a).contains(b);
};

util.stringToBool = function (string) {
	switch (string) {
		case 'true': case 'yes': case '1': return true;
		case 'false': case 'no': case '0': case null: return false;
		default: return Boolean(string);
	}
};

// return steamid64 representation of normal steamid
util.sidTo64 = function (steamid) {
	return sidc.convertTo64(steamid);
};

// Returns an asterisk if true
util.boolStar = function (bool) {
	return (bool ? '*' : '');
};

util.rank = function (xp) {
	if (xp < 27) {
		return '♟ Pawn';
	} else if (xp >= 27 && xp < 45) {
		return '♙ Pawn+';
	} else if (xp >= 45 && xp < 70) {
		return '♞ Knight';
	} else if (xp >= 70 && xp < 105) {
		return '♘ Knight+';
	} else if (xp >= 105 && xp < 136) {
		return '♝ Bishop';
	} else if (xp >= 136 && xp < 180) {
		return '♗ Bishop+';
	} else if (xp >= 180 && xp < 221) {
		return '♜ Rook';
	} else if (xp >= 221 && xp < 270) {
		return '♖ Rook+';
	} else if (xp >= 270 && xp < 330) {
		return '♛ Queen';
	} else if (xp >= 330 && xp < 420) {
		return '♕ Queen+';
	} else if (xp >= 420 && xp < 461) {
		return '♔ King';
	} else if (xp >= 461) {
		return 'Ⓛ Legend';
	}
};

util.xptot = function (xp) {
	if (xp < 27) {
		return xp + ' / 27';
	} else if (xp >= 27 && xp < 45) {
		return xp + ' / 45';
	} else if (xp >= 45 && xp < 70) {
		return xp + ' / 70';
	} else if (xp >= 70 && xp < 105) {
		return xp + ' / 205';
	} else if (xp >= 105 && xp < 136) {
		return xp + ' / 136';
	} else if (xp >= 136 && xp < 180) {
		return xp + ' / 180';
	} else if (xp >= 180 && xp < 221) {
		return xp + ' / 221';
	} else if (xp >= 221 && xp < 270) {
		return xp + ' / 270';
	} else if (xp >= 270 && xp < 330) {
		return xp + ' / 330';
	} else if (xp >= 330 && xp < 420) {
		return xp + ' / 420';
	} else if (xp >= 420 && xp < 461) {
		return xp + ' / 460';
	} else if (xp >= 461) {
		return xp;
	}
};

util.formatPlayers = function(t1n, t2n, players) {
	let formatted = t1n + ' ::  [ ';

	for (let i = 0; i < 5; i++) {
		formatted += ' <https://kiir.us/username/' + players[i] + '|' + players[i] + '> ';
	}

	formatted += ' ]\n' + t2n + ' :: [ ';

	for (let j = 5; j < 10; j++) {
		formatted += ' <https://kiir.us/username/' + players[j] + '|' + players[j] + '> ';
	}

	formatted += ' ]';
	return formatted;
};

util.genPayload = function (type, id, ip, pass, hash, map, t1n, t2n, players) {
	let formattedPlayers = util.formatPlayers(t1n, t2n, players);
	let payload = "{\"channel\": \"#kiwi-matches\", \"username\": \"kiwi-match\", \"text\": \"[Match #" + id + " (" + hash + ") (" + type + ") (11:44 AM)] : <https://kiir.us/match/" + id + "|Match page>\", \"attachments\":[" +
      "{" +
         "\"fallback\":\"password " + pass + "; connect " + ip + ";\"," +
         "\"pretext\":\"password " + pass + "; connect " + ip + ";\"," +
         "\"color\":\"#33CC00\"," +
         "\"fields\":[" +
            "{" +
               "\"title\":\"" + t1n + " vs " + t2n + "  -->  " + map + "\"," +
               "\"value\":\"" + formattedPlayers + "\"," +
               "\"short\":false" +
            "}" +
         "]" +
      "}" +
   "]}";

   return payload;
};

module.exports = util;
