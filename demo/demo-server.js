const io = require('socket.io').listen(8080);
const ss = require('socket.io-stream');
const fs = require('fs');
var path = require('path');


io.sockets.on('connection', function(socket){
  console.log('client connected');

  ss(socket).on('foo', function(stream, data) {
    var filename = path.basename(data.name);
    stream.pipe(fs.createWriteStream('test/' + filename));
  });

  /*var delivery = dl.listen(socket);

  delivery.on('receive.success',function(file){
    fs.writeFile("test/" + file.name, file.buffer, function(err){
      if(err){
        console.log('File could not be saved: ' + err);
      }else{
        console.log('File ' + file.name + " saved");
      };
    });
  });*/

});

/*process.on('uncaughtException', function (err) {
  console.log('Oh shit recover somehow');
});
*/
