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

function fetchFullTramitesByIdDepto(idDepto, resultado) {
  fetchAllTramites(function(result){
    let arrayKeys = Object.keys(result);
    let arrayFull = Object.values(result);
    let arrayResult = [{}];
    arrayFull.forEach(function (element, index) {
      if(element.departamento == idDepto){
        arrayFull[index].id = arrayKeys[index];
        arrayResult = arrayFull;
      }
    });
    resultado(arrayResult);
  });
}

function fetchFullTramiteById(idTramite, resultado){
  fetchAllTramites(function(result){
    let arrayKeys = Object.keys(result);
    let arrayFull = Object.values(result);
    let arrayResult = [{}];
    let tramite = {};
    arrayFull.forEach(function (element, index) {
      arrayFull[index].id = arrayKeys[index];
      arrayResult = arrayFull;
      if(arrayResult[i].id == idTramite){
        tramite = arrayResult[i];
      }
    });
    resultado(tramite);
  });
}


app.post('/sacvog', function (req, res) {

  let deptos = req.body.queryResult.parameters.deptos || 'vacio';       //Pide lista de deptos
  let tram = req.body.queryResult.parameters.tram || 'vacio';           //Pide lista de de tramites 
  let deptoTramite = req.body.queryResult.parameters.depto || 'vacio';  //De acuerdo a este depto.

  //Valores para solicitar una constancia con su tipo
  let dep = req.body.queryResult.parameters.depto || 'vacio';         //departamento
  let doc = req.body.queryResult.parameters.documento || 'vacio';     //documento que necesita
  let si = req.body.queryResult.queryText || 'vacio';                 //Responde si al hecho de datos extras
  
  //let deptos = req.headers.deptos || 'vacio';
  //let tram = req.headers.tram || 'vacio';
  //let deptoTramite = req.headers.depto || 'vacio';
  
  //let dep = req.headers.depto || 'vacio';
  //let doc = req.headers.documento || 'vacio';
  
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
      fetchFullTramitesByIdDepto(result, function(resultadoFull){
        //Recorremos el array para ver si existe el tramite
        let ok = false;
        let posiblesDocs = "";
        let exacto = false;
        resultadoFull.forEach(function (element, index) {
          let name = sinDiacriticos(element.name).toLowerCase().trim();
          let document = sinDiacriticos(doc).toLowerCase().trim();
          if(name.includes(document)){
            ok = true;
            //Hubo coincidencia en el elemento posicion index de resultado Full
            //Veremos si es exacto
            if(name == document){
              //el tramite es exacto
              exacto = true;
              //Ahora verificamos si tiene datos extras
              if(typeof element.extras !== "undefined"){
                console.log("Tiene datos extras");
                for(var i in element.extras){
                  //console.log(element.extras [i].name);
                }
                res.json({
                  fulfillmentText: "Esté documento puede contener datos extras, ¿quiere escucharlos?",
                  source: "webhook-echo-sample",
                  outputContexts: 
                    [{
                      name: "projects/sac-vog-cecebh/agent/sessions/123456/contexts/pdf",
                      lifespanCount: 5,
                      parameters: {
                          doc:  element.id,
                          depto: element.departamento,
                        }
                    }]
                });
              }else{
                res.json({
                  fulfillmentText: "Espere por favor, su trámite se esta generando...",
                  source: "webhook-echo-sample",
                  outputContexts: 
                    [{
                      name: "projects/sac-vog-cecebh/agent/sessions/123456/contexts/pdf",
                      lifespanCount: 5,
                      parameters: {
                          doc:  element.id,
                          depto: element.departamento,
                        }
                    }]
                });
              }
            }else{
              posiblesDocs+=element.name+" ,";
            }
          }
        });
        if(ok == false){
          fetchTramitesByIdDepto(result, function(resultado){
            res.json({
              fulfillmentText: 'Lo siento, el departamento de: '+dep+' solo emite los siguientes trámites: ' +resultado,
              source: "webhook-echo-sample"
            });
          });
        }else if(ok == true && exacto == false){
          //Se cumplio, pero el doc no fue exacto, regresara los posibles documentos que hay
          res.json({
            fulfillmentText: 'El departamento de: '+dep+' emite éstos documentos parecidos con el que ústed ésta buscando: ' +posiblesDocs,
            source: "webhook-echo-sample"
          });
        }
      });
    });
  }else if(si !== 'vacio'){
    //Si quiere datos extras
    let doc = req.body.queryResult.outputContexts[0].parameters.doc;
    let depto = req.body.queryResult.outputContexts[0].parameters.depto;
    fetchFullTramiteById(doc, function(tramite){
      res.json({
        fulfillmentText: 'Enlistando datos extras',
        docu: doc,
        depato: depto,
        source: "webhook-echo-sample"
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
