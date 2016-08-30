/**
 * Created by Drew on 5/23/2016.
 */
var cron = require('cron');
var S = require('string');
var requestify = require('requestify');
var recursive = require('recursive-readdir');
var path = require("path");
var HashMap = require("hashmap");
var fs = require("fs");
var datetime = require('node-datetime');
var sys = require('sys');
var exec = require('child_process').exec;
var gutil = require('gulp-util');

//HashMap of demos and filesizes
var dList = new HashMap();
//HashMap of demos and check counters
var checkdList = new HashMap();
//HashMap of demos to check for on the server to delete if they've been uploaded
var delList = new HashMap();

log("~ TALON DEMO PARSER v0.7");

//Wraps console.log for printing date in front
function log(message) {
    var dt = datetime.create();
    var time = dt.format('m/d/y H:M:S');
    console.log('[' + time + '] ' + message);
}

//Check if string contains another
function contains(a, b) {
    return S(a).contains(b);
}

//Returns size of file given by filename
function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    return stats['size'];
}

//Ignores a file if it isn't a demo file
function ignoreFunc(file, stats) {
    // `file` is the absolute path to the file, and `stats` is an `fs.Stats`
    // object returned from `fs.lstat()`.
    return !contains(file, ".dem");
}

//Returns the actual demo filename from the path
function getDemoName(filename) {
    //log('FILEPATH: ' + filename);
    //log('FILE: ' + file);
    //log("REFERENCED: " + file);
    return path.basename(filename);
}

//Echos some bs on rsync
function puts(error, stdout, stderr) {
    if (stdout !== null) {
        log(gutil.colors.green(stdout));
    }
    if (stderr !== null) {
        log(gutil.colors.red(stderr));
    }
    if (error !== null) {
        log(gutil.colors.red(error));
    }
}

//Deletes the demo from the local drive
function deleteDemo(code, filename) {
    log('DELETE?: ' + code + " - " + filename);
    if (code === true) {
        fs.exists(filename, function(exists) {
            if (exists) {
                //Show in green
                log(gutil.colors.green('DELETING LOCAL DEMO: ' + filename));
                fs.unlink(filename);
                delList.remove(filename);
                checkdList.remove(filename);
                dList.remove(filename);
            } else {
                //Show in red
                log(gutil.colors.red('LOCAL DEMO NOT FOUND: ' + filename));
                delList.remove(filename);
                checkdList.remove(filename);
                dList.remove(filename);
            }
        });
    } else {
        log(gutil.colors.red('Demo not found on server: 404'));
    }
}

function sendFileToDemoCDN(filename) {
    exec("sshpass -p \"@@DJDROPIRISH&!#@@KIIRUS&!#@@\" rsync " + filename + " root@demo.kiir.us:/var/www/demo/" + getDemoName(filename), puts);
}

function demoExistsOnCDN(Url, callback, filename) {
    var http = require('http'),
        url = require('url');
    var options = {
        method: 'HEAD',
        host: url.parse(Url).host,
        port: 80,
        path: url.parse(Url).pathname
    };
    var req = http.request(options, function(r) {
        log("GOT: " + r.statusCode);
        callback(r.statusCode == 200, filename);
    });
    req.end();
}

//Checks for demo files and uploads them a minute
//after their file size has stopped increasing
var checkForDemos = cron.job("*/20 * * * * *", function() {
    log(gutil.colors.green('Checking for demos...'));
    //Find new demo files
    recursive("C:\\KIWI", /*[ignoreFunc],*/ function(err, files) {
        if (err !== null) {
            log(gutil.colors.red('Errors: ' + err));
        }
        // Files is an array of filenames
        for (var i = 0; i < files.length; i++) {
            if (!dList.has(files[i]) && contains(files[i], ".dem")) {
                log(gutil.colors.blue('ADDED: ' + files[i]));
                dList.set(files[i], getFilesizeInBytes(files[i]));
                checkdList.set(files[i], 0);
            }
        }
    });
});

var checkDemoGrowth = cron.job("*/20 * * * * *", function() {
    dList.forEach(function(value, key) {
        //Check for demo file growth
        var currSize = getFilesizeInBytes(key);
        if (currSize > value) {
            log("STILL RECORDING: " + getDemoName(key));
            dList.set(key, currSize);
            checkdList.set(key, 0);
        } else {
            //Add 1 to value of 20 second intervals file size has been the same
            log("UNCHANGED: " + getDemoName(key));
            checkdList.set(key, checkdList.get(key) + 1);
            //If a minute has passed with no growth
            if (checkdList.get(key) == 3) {
                log("UPLOADING: " + getDemoName(key));
                //Upload demo to CDN, check for success, and delete demo from local server
                delList.set(key, 0);
                sendFileToDemoCDN(key);
            }
        }
    });
});

var checkToDelete = cron.job("*/5 * * * * *", function() {
    if (delList.count() > 0) {
        log('Checking for uploaded demos.');
        delList.forEach(function(value, key) {
            log('CHECKING FOR: http://demo.kiir.us/demos/' + getDemoName(key));
            demoExistsOnCDN('http://demo.kiir.us/demos/' + getDemoName(key), deleteDemo, key);
        });
    }
});

checkForDemos.start();
checkDemoGrowth.start();
checkToDelete.start();
