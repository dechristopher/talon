/*
Created by Andrew DeChristopher <drew@kiir.us> on 8/30/2016.
 */
const io = require('socket.io-client');
const socket = io.connect('http://localhost:8080', {reconnect: true});
const fs = require('fs');
const ss = require('socket.io-stream');

socket.on( 'connect', function() {
  console.log( "Sockets connected" );

  var stream = ss.createStream();
  var filename = 'kiwi-25.dem';

  ss(socket).emit('foo', stream, {name: filename});
  fs.createReadStream(filename).pipe(stream);
});
