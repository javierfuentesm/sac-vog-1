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
    let tramite = {};
    arrayFull.forEach(function (element, index) {
      arrayFull[index].id = arrayKeys[index];
      if(arrayFull[index].id == idTramite){
        tramite = arrayFull[index];
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
  let yesOrNot = req.body.queryResult.queryText || 'vacio';                 //Responde si al hecho de datos extras
  let dataExtra = req.body.queryResult.parameters.datosextras || 'vacio';
  
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
                //Si tiene datos extras, crearemos un json con ellos
                var extras = {};
                for(var i in element.extras){
                  extras[element.extras[i].clave] = false;
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
                          extras: extras
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
                      lifespanCount: 10,
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
  }else if(yesOrNot !== 'vacio' && dataExtra === 'vacio'){
    let posicionContexto = 0;
    req.body.queryResult.outputContexts.forEach(function (element, index) {
      if(element.name.includes('pdf')){
        posicionContexto = index;
      }
    });
    let doc = req.body.queryResult.outputContexts[posicionContexto].parameters.doc;
    let depto = req.body.queryResult.outputContexts[posicionContexto].parameters.depto;
    if(yesOrNot.includes('si')){
      fetchFullTramiteById(doc, function(tramite){
        var extrasString = "";
        var extras = {};
        for(var i in tramite.extras){
          extrasString+=tramite.extras[i].name+", ";
          extras[tramite.extras[i].clave] = false;
        }
        res.json({
          fulfillmentText: 'Los datos extras que puede contener son: '+extrasString+'¿Desea agregar alguno?',
          source: "webhook-echo-sample"
        });
      });
    }else{
      //Dijo que NO
      res.json({
        fulfillmentText: "Espere por favor, su trámite se esta generando...",
        source: "webhook-echo-sample",
        outputContexts: 
          [{
            name: "projects/sac-vog-cecebh/agent/sessions/123456/contexts/pdf",
            lifespanCount: 10,
            parameters: {
                doc:  doc,
                depto:  depto,
            },
            finish: true
          }]
      });
    }
  }else if(dataExtra !== 'vacio'){
    //Vemos que dato extra fue, lo ponemos en tru, y le decimos si quiere otro mas.
    let posicionContexto = 0;
    req.body.queryResult.outputContexts.forEach(function (element, index) {
      if(element.name.includes('pdf')){
        posicionContexto = index;
      }
    });
    let doc = req.body.queryResult.outputContexts[posicionContexto].parameters.doc;
    let depto = req.body.queryResult.outputContexts[posicionContexto].parameters.depto;
    var extrasLine = req.body.queryResult.outputContexts[posicionContexto].parameters.extras; //Los extras actuales
    let exist = false;
    var extrasString = "";
    var nuevosExtras = {};
    fetchFullTramiteById(doc, function(tramite){
      for(var i in tramite.extras){
        if(sinDiacriticos(tramite.extras[i].name).toLowerCase().includes(sinDiacriticos(dataExtra).toLowerCase())){
          //El dato que dijo si existe en el documento
          exist = true;
          //Lo pasamos a true, y lo quitamos de los datos extra que puede contener
          nuevosExtras[tramite.extras[i].clave] = true;
        }else{
          //Seguiremos listando el dato mientras no este ya en true
          if(extrasLine[tramite.extras[i].clave] == false){
            extrasString+=tramite.extras[i].name+", ";
          }
          nuevosExtras[tramite.extras[i].clave] = extrasLine[tramite.extras[i].clave];
        }
      }
      if(exist == false){
        res.json({
          fulfillmentText: 'Ese dato extra no lo puede contener el tramite, los datos extras que puede contener son: '+extrasString+'¿Desea agregar alguno?',
          source: "webhook-echo-sample"
        });
      }else{
        //Si existio su tramite y se agrego al json
        if(extrasString==" "){
          res.json({
            fulfillmentText: 'El dato se agrego con exito, espere por favor, su trámite se esta generando...',
            source: "webhook-echo-sample",
            outputContexts: 
              [{
                name: "projects/sac-vog-cecebh/agent/sessions/123456/contexts/pdf",
                lifespanCount: 10,
                parameters: {
                    extras: nuevosExtras
                  }
              }]
          });
        }else{
          res.json({
            fulfillmentText: 'El dato se agrego con exito, quedan los siguientes datos extras: '+extrasString+'¿Desea agregar alguno?',
            source: "webhook-echo-sample",
            outputContexts: 
              [{
                name: "projects/sac-vog-cecebh/agent/sessions/123456/contexts/pdf",
                lifespanCount: 10,
                parameters: {
                    extras: nuevosExtras
                  }
              }]
          });
        }
      }
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

var getFromBetween = {
  results:[],
  string:"",
  getFromBetween:function (sub1,sub2) {
      if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
      var SP = this.string.indexOf(sub1)+sub1.length;
      var string1 = this.string.substr(0,SP);
      var string2 = this.string.substr(SP);
      var TP = string1.length + string2.indexOf(sub2);
      return this.string.substring(SP,TP);
  },
  removeFromBetween:function (sub1,sub2) {
      if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
      var removal = sub1+this.getFromBetween(sub1,sub2)+sub2;
      this.string = this.string.replace(removal,"");
  },
  getAllResults:function (sub1,sub2) {
      // first check to see if we do have both substrings
      if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;

      // find one result
      var result = this.getFromBetween(sub1,sub2);
      // push it to the results array
      this.results.push(result);
      // remove the most recently found one from the string
      this.removeFromBetween(sub1,sub2);

      // if there's more substrings
      if(this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
          this.getAllResults(sub1,sub2);
      }
      else return;
  },
  get:function (string,sub1,sub2) {
      this.results = [];
      this.string = string;
      this.getAllResults(sub1,sub2);
      return this.results;
  }
};