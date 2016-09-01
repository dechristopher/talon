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
});

socket.on('disconnect', function() {
    console.log(DEMO_RED + "Disconnected from demo CDN.");
    go = false;
});

function finished(filename){
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
            console.log(DEMO + 'FILLED:', list);
        } else {
            throw new Error(ERROR_NO_FOLDER + file);
            //log('DEMO LOCATION FILE DOES NOT EXIST! HALTING');
            //process.exit();
        }
    });
}
