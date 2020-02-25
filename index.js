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

function fetchAllTramites(result) {
	tramitesRef.on('value', function(snapshot) {
	  result(snapshot.val());
	});
}

function fetchIdDeptoByName(name,resultado) {
	fetchAllDeptos(function(result){
    let array = Object.values(result);
    let arrayKeys = Object.keys(result);
    let posicion = 0;
    array.forEach(function (element, index) {
      let nombre = sinDiacriticos(element.name).toLowerCase().trim().replace(/ /g, "");
      let nombreInput = sinDiacriticos(name).toLowerCase().trim().replace(/ /g, "");
      if(nombre==nombreInput){
        posicion = index;
      }
    });
    resultado(arrayKeys[posicion]);
  });
}

function fetchTramitesByIdDepto(idDepto, resultado) {
  fetchAllTramites(function(result){
    let array = Object.values(result);
    let respuesta = '';
    array.forEach(function (element) {
      if(element.departamento == idDepto){
        respuesta+=element.name+', ';
      }
    });
    resultado(respuesta);
  });
}

app.post('/sacvog', function (req, res) {

  let deptos = req.body.queryResult.parameters.deptos || 'vacio';
  let tramite = req.body.queryResult.parameters.tram || 'vacio';
  let deptoTramite = req.body.queryResult.parameters.depto || 'vacio';

  //let deptos = req.headers.deptos || 'vacio';
  //let tram = req.headers.tram || 'vacio';
  //let deptoTramite = req.headers.depto || 'vacio';
  
  if ( deptos !== 'vacio' ) {
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
        res.json({
          fulfillmentText: 'Los departamentos que hay en la institución son: '+respuesta,
          source: "webhook-echo-sample"
        });
      }
    });
  }else if ( tram !== 'vacio' ){
    //Pide saber que tramites hay en un x DEPTO
    fetchIdDeptoByName(deptoTramite, function(result){
      fetchTramitesByIdDepto(result, function(resultado){
        res.json({
          fulfillmentText: 'Los trámites que emite: ' + deptoTramite + ' son: '+resultado,
          source: "webhook-echo-sample"
        });
      });
    });
  }else{
    res.json({
      fulfillmentText: 'No entro a ninguna variable',
      source: "webhook-echo-sample"
    });
  }
});

app.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening in port 8000");
});

function sinDiacriticos(texto) {
  return texto
         .normalize('NFD')
         .replace(/([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,"$1")
         .normalize();
}
