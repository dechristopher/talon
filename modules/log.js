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
    }else{
        file = 'logs/' + today + '-' + logname + '.log';
    }
    console.log('[' + time + '] ' + message);

    fs.exists(file, function(exists) {
        if (exists) {
            fs.appendFile(file, '[' + time + '] ' + message + os.EOL, function(err) {
                if (err) {
                    return console.log("FILE LOGGING FAILED AT " + time + "for MSG: " + message);
                }
            });
        } else {
            fs.writeFile(file, 'BEGIN TALON LOG FOR ' + today + os.EOL, function(err) {
                if (err) {
                    return console.log("FILE CREATION FAILED AT " + time + "for FILE: " + file);
                }
                console.log('Created new log >> ' + file);
            });
        }
    });
}

module.exports = log;
