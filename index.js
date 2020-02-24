"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const firebase = require('firebase');
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
const databaseRef = firebase.database().ref();
const departamentosRef = databaseRef.child('departamentos');
const tramitesRef = databaseRef.child('tramites');

function fetchAllDeptos(result) {
	departamentosRef.on('value', function(snapshot) {
	  result(snapshot.val());
	});
}


app.post('/sacvog', function (req, res) {

  let deptos =
    req.body.queryResult &&
    req.body.queryResult.parameters &&
    req.body.queryResult.parameters.deptos
      ? req.body.queryResult.parameters.deptos
      : "vacio";
  
  if ( deptos!="vacio" ) {
    //Necesita saber que departamentos hay
    fetchAllDeptos(function(result){
      if (result!=null) {
        let array = Object.values(result);
        let respuesta = '';
        for(let i=0;i<array.length;i++){
          
          if(i==(array.length-1)){
            respuesta+="y "+array[i].name;
          }else{
            respuesta+=array[i].name+', ';
          }
        }
        console.log(respuesta);
        //Teniendo la respuesta, solo respondemos
        res.json({
          fulfillmentText: 'Los departamentos que hay en la institucion son: '+respuesta,
          source: "webhook-echo-sample"
        });
      }
    });
  }


  res.json({
    fulfillmentText: 'No entro a ninguna variable',
    source: "webhook-echo-sample"
  });
  
});

app.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening in port 8000");
});






