const io = require('socket.io').listen(8080);
const dl = require('delivery');
const fs = require('fs');

io.sockets.on('connection', function(socket){
  console.log('client connected');
  var delivery = dl.listen(socket);

  delivery.on('receive.success',function(file){
    fs.writeFile("test/" + file.name, file.buffer, function(err){
      if(err){
        console.log('File could not be saved: ' + err);
      }else{
        console.log('File ' + file.name + " saved");
      };
    });
  });

});
