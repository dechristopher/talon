/*
Created by Andrew DeChristopher <drew@kiir.us> on 8/30/2016.
 */
const io = require('socket.io-client');
const socket = io.connect('http://demo.kiir.us:27000', {
    reconnect: true
});
const ss = require('socket.io-stream');
const cron = require('cron');
const fs = require('fs');
const ArrayList = require("arraylist");
const lupus = require('lupus');
const HashMap = require("hashmap");
const requestify = require('requestify');

var demoFolders = new ArrayList();

populateDemoFolders("conf/demo.txt", demoFolders);

socket.on('connect', function() {
    console.log("Sockets connected");

    var stream = ss.createStream();
    var filename = 'C:\\KIWI\\kp1\\csgo\\demos\\kiwi-43.dem';

    ss(socket).emit('us-nj1', stream, {
        name: filename
    });
    fs.createReadStream(filename).pipe(stream);
});

//Fill the servers[] array with lines from
//a given text file
function populateDemoFolders(file, list) {
    fs.exists(file, function(exists) {
        if (exists) {
            fs.readFileSync(file).toString().split('\n').forEach(function(line) {
                if (line !== '') {
                    list.add(line);
                }
            });
            console.log('FILLED:', list);
        } else {
            log('DEMO LOCATION FILE DOES NOT EXIST! HALTING');
            process.exit();
        }
    });
}
