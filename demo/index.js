// Setup basic express server
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 3000;
var downloadProgress = require('..');

io.on('connection', function(socket){
  console.log('connection');
  socket.on('event', function(data){});
  socket.on('disconnect', function(){});
});

app.set('view engine', 'jade');

app.use(downloadProgress('public', {
  io: io
}));

app.get('/', function (req, res) {
  res.render('index');
});

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});
