// A simple webping server using Socket.IO, Express and lodash.
//
var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');
var _ = require('lodash');
//
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(
  express.static(path.resolve(__dirname, 'client'))
);

// socketioの接続を管理
var sockets = [];

// 定期的にサーバからpingを発行する。
(function(){
  var seq = 0;
  var timer = function(){
    // 直近３回反応がないsocketをpingの対象から外す。
    sockets = _.filter(sockets, function(socket){
      if(_.isUndefined(socket.latest)){
        return true;
      }
      return (seq - socket.latest < 3);
    });
    
    // activeなsocketにpingを送る。
    _.forEach(sockets, function(socket){
      socket.emit('ping', {
        seq: seq,
        time: Date.now()
      });
    });
    // 接続が０になったらseqをリセットする
    if(!sockets.length){
      seq = 0;
    }
    seq+=1;
    setTimeout(timer, 2000);
  };
  setTimeout(timer, 2000);
})();

io.on('connection', function (socket) {
  var idx = 0;
  console.log("connected");
  socket.on('disconnect', function (s) {
    console.log("disconnected");
    var rmIdx = _.indexOf(sockets, socket);
    _.pullAt(sockets, rmIdx);
    //console.log(sockets.length);
  });
  sockets.push(socket);
  idx += 1;
  socket.emit('init', {host: "client" + idx});
  socket.on('getready', function(data){
    socket.rttlist = new Array(30);
  });
  socket.on('pong', function (data) {
    var rtt = Date.now() - data.time;
    delete data.time;
    data.rtt = rtt;
    socket.latest = data.seq;
    // 直近の決まった数だけ保持する。
    socket.rttlist.shift();
    socket.rttlist.push(data);
    // rttをクライアントに送信
    socket.emit("results", data);
    console.log("pong " + rtt + " " +data.host + " " + data.seq);
  });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("webping server listening at", addr.address + ":" + addr.port);
});
