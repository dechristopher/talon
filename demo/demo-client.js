/*
Created by Andrew DeChristopher <drew@kiir.us> on 8/30/2016.
 */

//socket libraries
const io = require('socket.io-client');
const ss = require('socket.io-stream');
const socket = io.connect('http://demo.kiir.us:27000', {
    reconnect: true
});

//core libraries
const cron = require('cron');
const datetime = require('node-datetime');
const fs = require('fs');
const ArrayList = require("arraylist");
const lupus = require('lupus');
const HashMap = require("hashmap");
const requestify = require('requestify');
const gutil = require('gulp-util');
const os = require('os');
const recursive = require('recursive-readdir');

//talon libraries
const log = require('../modules/log');

//Define ERORS and other constants
const ERROR_NO_FOLDER = '[' + gutil.colors.red('ERROR') + '] Given demo folder does not exist: ';
const ERROR_NO_REGION = '[' + gutil.colors.red('ERROR') + '] Please use a package.json script to define region.';
const ERROR_BAD_REGION = '[' + gutil.colors.red('ERROR') + '] Invalid region specified.';
const DEMO = '[' + gutil.colors.green('DEMO') + '] ';
const DEMO_RED = '[' + gutil.colors.red('DEMO') + '] ';

var demoFolders = new ArrayList();

const usnj1sock = 'us-nj1';
const usnj2sock = 'us-nj2';
var sock = '';
var go = false;

log(DEMO + 'KIWI Demo Uploader - initializing..', '-demo-client');

populateDemoFolders("conf/demo.txt", demoFolders);

//Set correct socket.io channel
if (process.argv.length > 2) {
    if (process.argv[2] == "us-nj1") {
        log(DEMO + 'Starting US-NJ1 Uploader', '-demo-client');
        sock = usnj1sock;
    } else if (process.argv[2] == "us-nj2") {
        log(DEMO + 'Starting US-NJ2 Uploader', '-demo-client');
        sock = usnj2sock;
    } else {
        throw new Error(ERROR_BAD_REGION);
    }
} else {
    throw new Error(ERROR_NO_REGION);
}

socket.on('connect', function() {
    console.log(DEMO + "Connected to demo CDN.");
    go = true;
    upload();
});

socket.on('disconnect', function() {
    console.log(DEMO_RED + "Disconnected from demo CDN.");
    go = false;
});

function finished(filename) {
    log(DEMO + ' DONE -> ' + filename, '-demo-client');
}

//Fill the servers[] array with lines from
//a given text file
function populateDemoFolders(file, list) {
    fs.exists(file, function(exists) {
        if (exists) {
            //fs.readFileSync(file).toString().split('\n').forEach(function(line) {
            fs.readFileSync(file).toString().split(os.EOL).forEach(function(line) {
                if (line !== '') {
                    list.add(line);
                }
            });
            log(DEMO + 'FILLED: ' + list, '-demo-client');
        } else {
            throw new Error(ERROR_NO_FOLDER + file);
            //log('DEMO LOCATION FILE DOES NOT EXIST! HALTING');
            //process.exit();
        }
    });
}

function upload(filename) {
    if (go) {
        var stream = ss.createStream();
        var filename = 'C:\\KIWI\\kp3\\csgo\\demos\\kiwi-26.dem';

        ss(socket).emit(sock, stream, {
            name: filename
        });

        fs.createReadStream(filename).pipe(stream, finished(filename));

    } else {

    }
}

//Checks for demo files and uploads them a minute
//after their file size has stopped increasing
var checkForDemos = cron.job("*/30 * * * * *", function() {
    log(DEMO + 'Checking directories...', '-demo-client');
    //Find new demo files
    demoFolders.each(function(value) {
        recursive(value, /*[ignoreFunc],*/ function(err, files) {
            if (err !== null) {
                log(gutil.colors.red('Errors: ' + err), '-demo-client');
            }
            for (var i = 0; i < files.length; i++) {
                log(DEMO + 'Demo parsed: ' + files[i], '-demo-client')
                //upload(files[i]);
            }
            // Files is an array of filenames
            /*for (var i = 0; i < files.length; i++) {
                if (!dList.has(files[i]) && contains(files[i], ".dem")) {
                    log(gutil.colors.blue('ADDED: ' + files[i]), '-demo-client');
                    dList.set(files[i], getFilesizeInBytes(files[i]));
                    checkdList.set(files[i], 0);
                }
            }*/
        });
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
            log("UNCHANGED: " + getDemoName(key), '-demo-client');
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
        log(DEMO + 'Checking for uploaded demos.', '-demo-client');
        delList.forEach(function(value, key) {
            log('CHECKING FOR: http://demo.kiir.us/demos/' + getDemoName(key), '-demo-client');
            demoExistsOnCDN('http://demo.kiir.us/demos/' + getDemoName(key), deleteDemo, key);
        });
    }
});

checkForDemos.start();
