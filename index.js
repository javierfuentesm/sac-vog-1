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
    respuesta = respuesta.substr(0, respuesta.length-1)
    resultado(respuesta);
  });
}


app.post('/sacvog', function (req, res) {

  let deptos = req.body.queryResult.parameters.deptos || 'vacio';       //Pide lista de deptos
  let tram = req.body.queryResult.parameters.tram || 'vacio';           //Pide lista de de tramites 
  let deptoTramite = req.body.queryResult.parameters.depto || 'vacio';  //De acuerdo a este depto.

  //Valores para solicitar una constancia con su tipo
  let dep = req.body.queryResult.parameters.depto || 'vacio';         //departamento
  let doc = req.body.queryResult.parameters.documento || 'vacio';     //documento que necesita


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
  }else if( doc !== 'vacio' ){
    //ESTA PIDIENDO UN TRAMITE
    fetchIdDeptoByName(dep, function(result){
      fetchTramitesByIdDepto(result, function(resultado){
        if(resultado.includes(doc)){
          //El documento si pertenece al depto que pidio o parte del nombre
          //hacemos split de los tramites
          var arrayTramites = resultado.split(',');
          arrayTramites.forEach(function (element, index) {

          });

        }else{
          res.json({
            fulfillmentText: 'Lo siento, el departamento de: '+dep+' solo emite los siguientes trámites: ' +resultado,
            source: "webhook-echo-sample"
          });
        }
      });
    });
  }else{
    res.json({
      fulfillmentText: 'Lo siento, no entendí lo que solicitaste, ¿Podrías repetirlo?',
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
