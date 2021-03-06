/*
Created by Andrew DeChristopher <drew@kiir.us> on 1/5/2017.
 */

const fs = require('fs');
const c = require('chalk');
const log = require('./log');

const TALN = '[' + c.magenta('TALN') + '] ';

let flist = {};

// Fill an arraylist list with lines from a file
flist.fill = function (file, list, numSrv, displayname, err) {
	fs.exists(file, function (exists) {
		if (exists) {
			fs.readFileSync(file).toString().split('\n').forEach(function (line) {
				if (line !== '') {
					list.add(line);
				}
			});
			log(TALN + 'FILLED ' + displayname + ': [ ' + list + ' ]');
			numSrv = list.size();
		} else {
			throw new Error(err + file);
		}
	});
};

module.exports = flist;
