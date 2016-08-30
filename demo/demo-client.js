const io = require('socket.io-client');
const socket = io.connect('http://localhost:8080', {reconnect: true});
const dl = require('delivery');

socket.on( 'connect', function() {
  console.log( "Sockets connected" );

  delivery = dl.listen( socket );
  delivery.connect();

  delivery.on('delivery.connect',function(delivery){
    console.log('connected to server..')
    delivery.send({
      name: 'README.md',
      path : '../README.md'
    });

    delivery.on('send.success',function(file){
      console.log('File sent successfully!');
    });
  });

});
