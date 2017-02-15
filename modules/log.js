/*
Created by Andrew DeChristopher <drew@kiir.us> on 9/1/2016.
 */

const fs = require('fs');
const os = require('os');
const gutil = require('gulp-util');
const datetime = require('node-datetime');

const LOG = '[' + gutil.colors.blue('LOG') + '] ';

// Wraps console.log for printing date in front
// message: (string) message to log
// logname: (string) name of sub-log file (defaults to global log file)
// consoleOut: (bool) whether or not to print log to console (defaults to true)
function log(message, logname, consoleOut) {
	var time = datetime.create().format('m-d-y H:M:S');
	var today = datetime.create().format('m-d-y');
	var file = '';
	var line = '';

    // Handle logname argument
	if (logname === undefined) {
		file = 'logs/' + today + '.log';
		line = '[' + time + ']' + message;
	} else {
		file = 'logs/' + today + '-' + logname + '.log';
		line = '[' + time + ']' /* + [' + logname + '] */ + message;
	}

	// Handle consoleOut argument
	if (consoleOut === undefined) {
		console.log(line);
	} else if (consoleOut === true) {
		console.log(line);
	} else if (consoleOut === false) {
		// Do nothing
	}

	fs.exists(file, function (exists) {
		if (exists) {
			fs.appendFile(file, line + os.EOL, function (err) {
				if (err) {
					return console.log(LOG + 'FILE LOGGING FAILED AT ' + time + 'for MSG: ' + line);
				}
			});
		} else {
			fs.writeFile(file, 'BEGIN TALON LOG FOR ' + today + os.EOL, function (err) {
				if (err) {
					return console.log(LOG + 'LOG FILE CREATION FAILED AT ' + time + 'for FILE: ' + file);
				}
				console.log(LOG + 'Created new log >> ' + file);
			});
		}
	});
}

module.exports = log;
