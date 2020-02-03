"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const restService = express();

restService.use(
  bodyParser.urlencoded({
    extended: true
  })
);
restService.use(bodyParser.json());
// Funcion que se llama desde DialogFlow
restService.post("/echo", function(req, res) {
  /*
  var Variable1 =
    req.body.queryResult &&
    req.body.queryResult.parameters &&
    req.body.queryResult.parameters.Sensores
      ? req.body.queryResult.parameters.Sensores
      : "vacio";
  */

  respuesta = "Que onda, que pex";
  console.log(respuesta);
  return res.json({
      fulfillmentText: respuesta,
      source: "webhook-echo-sample"
  });

});

restService.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening");
});






