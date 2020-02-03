var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/clima', function (req, res) {
  res.json({fulfillmentText: 'Respondientdo desde webhook en node'});
});

app.listen(3000, function () {
  console.log('App escuchando puerto 3000');
});




