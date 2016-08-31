/*
Created by Andrew DeChristopher <drew@kiir.us> on 8/30/2016.
 */
const io = require('socket.io').listen(8080);
const ss = require('socket.io-stream');
const fs = require('fs');
var path = require('path');

io.sockets.on('connection', function(socket) {
    console.log('client connected');

    ss(socket).on('foo', function(stream, data) {
        var filename = path.basename(data.name);
        stream.pipe(fs.createWriteStream('test/' + filename));
    });
});
