/*
Created by Andrew DeChristopher <drew@kiir.us> on 8/30/2016.
 */


//core libraries
const io = require('socket.io').listen(27000);
const ss = require('socket.io-stream');
const fs = require('fs');
const path = require('path');

//custom libraries
const log = require('../modules/log');

log('[KIWI] Demo CDN Server', '-demo-server');

io.sockets.on('connection', function(socket) {
    log('Client connected', '-demo-server');
    //For uploads from US-NJ1
    ss(socket).on('us-nj1', function(stream, data) {
        var filename = path.basename(data.name).split('\\');
        var filename = filename[filename.length - 1];
        stream.pipe(fs.createWriteStream('/var/www-demo/demo/' + filename));
    });
    //For uploads from US-NJ2
    ss(socket).on('us-nj2', function(stream, data) {
        var filename = path.basename(data.name).split('\\');
        var filename = filename[filename.length - 1];
        stream.pipe(fs.createWriteStream('/var/www-demo/demo/' + filename));
    });
});
