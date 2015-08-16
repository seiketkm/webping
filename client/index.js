var socket = io.connect();
socket.on('init', function(data) {
  var hostname = data.host;
  // ping/pong ready
  socket.emit('getready', {
    host: hostname
  });
  socket.on('ping', function(data) {
    data.host = hostname;
    socket.emit('pong', data);
  });
  var ctx = document.getElementById("myChart").getContext("2d");
  var initArray = _.map(new Array(30), function() {
    return 0;
  });
  var myNewChart = new Chart(ctx).Line({
    labels: _.range(1, 30),
    datasets: [{
      label: "Ping Rtt Recorder",
      fillColor: "rgba(220,220,220,0.2)",
      strokeColor: "rgba(220,220,220,1)",
      pointColor: "rgba(220,220,220,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(220,220,220,1)",
      data: initArray
    }]
  }, {
    datasetFill: false,
    bezierCurve: false
  });

  socket.on('results', function(rtt) {
    myNewChart.removeData();
    myNewChart.addData([rtt.rtt], rtt.seq)
    myNewChart.update();
  });
})
