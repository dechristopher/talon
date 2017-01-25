const datetime = require('node-datetime');
const fs = require('fs');
const gutil = require('gulp-util');
const os = require('os');

const LOG = '[' + gutil.colors.blue('LOG') + '] ';

//Wraps console.log for printing date in front
function log(message, logname) {
    var time = datetime.create().format('m-d-y H:M:S');
    var today = datetime.create().format('m-d-y');
    var file = '';
    var line = '';
    if(logname === undefined){
        file = 'logs/' + today + '.log';
		line = '[' + time + ']' + message;
    }else{
        file = 'logs/' + today + '-' + logname + '.log';
		line = '[' + time + '][' + logname + ']' + message;
    }

    console.log(line);

    fs.exists(file, function(exists) {
        if (exists) {
            fs.appendFile(file, line + os.EOL, function(err) {
                if (err) {
                    return console.log(LOG + "FILE LOGGING FAILED AT " + time + "for MSG: " + line);
                }
            });
        } else {
            fs.writeFile(file, 'BEGIN TALON LOG FOR ' + today + os.EOL, function(err) {
                if (err) {
                    return console.log(LOG + "LOG FILE CREATION FAILED AT " + time + "for FILE: " + file);
                }
                console.log(LOG + 'Created new log >> ' + file);
            });
        }
    });
}

module.exports = log;
