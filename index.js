"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


app.post('/sacvog', function (req, res) {
  res.json({
    fulfillmentText: 'Respondientdo desde webhook en node',
    source: "webhook-echo-sample"
  });
});

app.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening in port 8000");
});






