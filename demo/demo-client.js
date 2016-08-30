var socket = require('socket.io');
var dl = require('delivery');

socket.on( 'connect', function() {
  log( "Sockets connected" );

  delivery = dl.listen( socket );
  delivery.connect();

  delivery.on('delivery.connect',function(delivery){
    delivery.send({
      name: 'sample-image.jpg',
      path : './sample-image.jpg'
    });

    delivery.on('send.success',function(file){
      console.log('File sent successfully!');
    });
  });

});
