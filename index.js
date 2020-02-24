"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var firebaseConfig = {
  apiKey: "AIzaSyBUtriEi8JJaA4eIT8A4vx-bLp6ES-iwdU",
  authDomain: "sac-vog.firebaseapp.com",
  databaseURL: "https://sac-vog.firebaseio.com",
  projectId: "sac-vog",
  storageBucket: "sac-vog.appspot.com",
  messagingSenderId: "126572601892",
  appId: "1:126572601892:web:d10819a671481388d9eeb1",
  measurementId: "G-4X4C4JDXN9"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

app.post('/sacvog', function (req, res) {
  res.json({
    fulfillmentText: 'Hola que hace?',
    source: "webhook-echo-sample"
  });
});

app.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening in port 8000");
});






