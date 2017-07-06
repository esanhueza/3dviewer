
var QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}();

// PARAMETERS
var guidList = ['1Io9jL33nJIm5jZVzr5UtQTqny-1IRmnOLO2XK-ZOSjE',
                '1MIhfTaNwC2Ke9yaPg9Ptow9cp7FnuQcc24rC8271HDo',
                '1CSBpyEWJ2-9nrB_a6cLML2oj8r9qDN1lxNNdFNu0uPY',
                '1JPuNPxzzhro2b_xXLNkeLI-5Il8h0fNKbjpBMnSST68',
                '1W_Wf_Az9_uCMesv2fxr3xWhBHRUPwVcAqcgSkabM7-8',
                '1anzJdB2JDuTiIq5YXPuz6dygNcTcLe4Z6iHYy0sKmT8',
                '1yl8vGarnbzhXMBk_5vF7E2rZlQtw70E5WWec09x_5Pg',
                '1VWGHCpsyJ-oMFnDxJnpp64BB5QBkix_ehJNFMD3u1H4',
                '1G_dq8XNSpLsK5LgQAEfOLtvHuf4NpNU2LobW0JH6vLg',
                '1omGhESDYyaz4cnay8W9Azk3brT6iePER9eCDuufZ48A',
                '1FD2-3Rmwkb8aYej56V4Kx4_HNsFn5ttdmY5Nj8VAF9g'
              ];

var orientationList = {
  1 : "Vertical de corte",
  2 : "Horizontal de corte",
  3 : "Vertical de frente",
  4 : "Horizontal de frente",
}

orientationList.getKey = function(value) {
  var object = this;
  return Object.keys(object).find(key => object[key] === value);
};

var link = $('#input-list-spreadsheet').val();
var match = new RegExp("d\/(.*)\/").exec(link);

var currentGuid;

// TOOLS VARS
var viewerSection = document.getElementById('viewer');
var materials = {};

// GUI VARS
var selectedItemIndex;
var items = document.getElementsByClassName("mesh-item");
var form = document.getElementById("mesh-form");
var piecesTable = $('#table-pieces');
var modelsTable = $('#models-table');
var roomTable   = $('#room-table');
var filename;

var appData = {
  models: {}
};


var resourceManager = new GoogleResourceManager();


// Se crea el visor 3D
var tool = ViewerTool.viewer;
tool.init(viewerSection);


function initGoogleApi(){
  gapi.load('client:auth2', function(){
    resourceManager.initClient();
  });
}
/*
 * inicializa la aplicacion cuando la informacion externa fue cargada
 */
function initApp(){
  updateProgress(100);
  initPiecesTable();
  initModelsTable();
  fillModelsGuids();
  // obtiene las texturas disponibles
  resourceManager.getTextureList(function(texturesList){
    editor.loadedTextures = texturesList;
    appData.textures = texturesList;
    tool.loadTextures(texturesList);
    // rellena select de textura en el editor de pieza
    fillTextureSelect(texturesList);
    loadDefaultModel();
  });

  appData['roomObjects'] = getRoomObjectsAvaliable();
  fillRoomObjectSelect( appData['roomObjects'] );
  tool.setAvaliableObjects( appData['roomObjects'] );
}

var options = {
  modelsTable: '#table-models',
  piecesTable: '#table-pieces',
  viewer: tool,
  pieceEditor: {
    editor : '#piece-editor',
    index  : '#piece-editor-index',
    model  : '#piece-editor-model',
    name   : '#piece-editor-name',
    width  : '#piece-editor input[name="w"]',
    height : '#piece-editor input[name="h"]',
    length : '#piece-editor input[name="l"]',
    x      : '#piece-editor input[name="x"]',
    y      : '#piece-editor input[name="y"]',
    z      : '#piece-editor input[name="z"]',
    visible  : '#piece-editor input[name="visible"]',
    wireframe: '#piece-editor input[name="wireframe"]',
    color    : '#piece-editor input[name="color"]',
    texture        : '#piece-editor select[name="texture"]',
    orientation    : '#piece-editor select[name="orientation"]',
  },
  modelEditor: {
    editor : '#model-editor',
    index  : '#model-editor-index',
    model  : '#model-editor-model',
    x      : '#model-editor input[name="x"]',
    y      : '#model-editor input[name="y"]',
    z      : '#model-editor input[name="z"]',
    rx     : '#model-editor input[name="rx"]',
    ry     : '#model-editor input[name="ry"]',
    rz     : '#model-editor input[name="rz"]',
    visible  : '#model-editor input[name="visible"]',
  }
}

var editor = new Editor(options);


$(document).ready(function(){
  initApp();
})


function loadDefaultModel(){
  /* si un modelo es especificado en la URL, entonces se carga automaticamente. */
  if (QueryString.model != undefined){
    if (parseInt(QueryString.model) > guidList.length){
      console.log("Modelo seleccionado no valido.");
      return
    }
    currentGuid = guidList[QueryString.model-1];
    loadModel([currentGuid]);
  }
}
/* rellena el elemento select para indicar que modelo se debe cargar al presionar el boton de cargar. */
function fillModelsGuids(){
  for (var i = 1; i <= guidList.length; i++) {
    var select = $('#model-spreadsheet');
    select.append('<option value='+guidList[i-1]+'>MOD'+(i) +'</option>')
  }
}


function updateProgress(progress){
  $("#bar-progress .progress-bar").css("width", progress+"%");
  if (progress < 100){
    $("#viewer").hide();
    $(".spinner").show();
    $("#bar-progress").show();
  }
  else{
    $("#viewer").show();
    $(".spinner").hide();
    $("#bar-progress").hide();
  }
}

// carga la información desde una hoja especifica (guid) del spreadsheet
function loadModel(modelsToLoad){
  updateProgress(0);

  var modelsLoaded = Array(modelsToLoad.length)
  modelsLoaded.fill(false)

  var rows = modelsTable.find('tbody').children();
  for (var i = 0; i < modelsToLoad.length; i++) {
    var guid = modelsToLoad[i];

    $.get({
      modelGuid: guid,
      modelIndex: i,
      url: "https://spreadsheets.google.com/feeds/list/" + guid + "/od6/public/full?alt=json",
      success: function(response) {
        var len = response.feed.entry.length;
        var parsedData = [];
        var data = response.feed.entry;
        filename = data[0].gsx$i.$t + "_" + data[0].gsx$j.$t + "_" + data[0].gsx$k.$t;
        var idModel = (guidList.indexOf(this.modelGuid)+1);

        for (var i = 2; i < data.length; i++) {
          var obj = data[i];
          if (obj.gsx$b.$t.length == 0) continue;

          var pieceData = {
              index: parsedData.length,
              visible: true,
              wireframe:  true,
              name: obj.gsx$b.$t,
              l: parseFloat(obj.gsx$d.$t.replace(',', '.')),
              w: parseFloat(obj.gsx$e.$t.replace(',', '.')),
              h: parseFloat(obj.gsx$f.$t.replace(',', '.')),
              orientation: parseInt(obj.gsx$g.$t),
              color: '0x' + obj.gsx$h.$t.replace(' ', ''),
              y: parseFloat(obj.gsx$i.$t.replace(',', '.')),
              x: parseFloat(obj.gsx$j.$t.replace(',', '.')),
              z: parseFloat(obj.gsx$k.$t.replace(',', '.')),
              model: "MOD"+idModel,
          }
          if (pieceData.w == 0 || pieceData.h == 0 || pieceData.l == 0){
            log('danger', 'Pieza "'+pieceData.name + '" del modelo MOD'+idModel+' presenta datos no validos. Se omite.');
            continue;
          }
          if (obj.gsx$l.$t.length > 0){
            var textureName = obj.gsx$l.$t;
            var texture = appData.textures.filter(function (chain) {
                return chain.name === textureName;
            })[0];
            if (texture != undefined){
              pieceData.texture = texture;
            }
          }
          if (isPieceValid(pieceData)){
            parsedData.push(pieceData);
          }
        }


        // se actualiza la informacion en el visor y en la tabla de piezas
        var model = {pieces:parsedData, guid:this.modelGuid, tag: "MOD" + idModel, x:0, y:0, z:0, rx:0, ry:0,rz:0,visible:true};

        //tool.addModel({tag: model.tag, });
        editor.appendModel(model);

        appData.models[model.tag] = model;
        appData.models[model.tag].pieces = parsedData;
        // setModelOnPiecesTable(model);
        // mark this model as loaded
        modelsLoaded[this.modelIndex] = true;


        // check if all models were loaded
        var taskDone = true;
        for (var j = 0; j < modelsLoaded.length; j++) {
          if (modelsLoaded[j] != true){
            taskDone = false
          }
        }
        // if this was the last task, hide spinner
        if (taskDone){
          updateProgress(100);
        }

        // updateModelsTable();

    },

    error: function(response){
      console.log("error loading model");
      console.log(response);
    }
  });

  }
}

function isPieceValid(d){
  if (isNaN(d.orientation) || isNaN(d.x) || isNaN(d.y) || isNaN(d.z)){
    return false;
  }
  return true;
}

// Agrega un modelo a la tabla de modelos
function updateModelsTable(){
  var models = []
  for (var tag in appData.models) {
    models.push(appData.models[tag]);
  }
  $('#table-models').bootstrapTable('load', models);
}

// actualiza los atributos del modelo en el visor con los datos obtenidos de la tabla
function updateModel(evt){
  var row = $(evt.target.parentElement.parentElement).children();
  newData = {};
  newData.tag = $(row[0]).html();
  newData.x = parseInt($(row[1]).find('input').val());
  newData.y = parseInt($(row[2]).find('input').val());
  newData.z = parseInt($(row[3]).find('input').val());
  newData.rx = parseInt($(row[4]).find('input').val());
  newData.ry = parseInt($(row[5]).find('input').val());
  newData.rz = parseInt($(row[6]).find('input').val());
  newData.visible = $(row[7]).find('input').is(':checked');
  tool.updateModel(newData);
}

function updateRoomElement(evt){
  var search = $(evt.target).parentsUntil('tbody');
  var row = $(search[search.length-1]);
  var tds = row.children();

  newData = {};
  newData.tag = row.attr('tag');
  newData.objectName = $(tds[0]).html();
  newData.x = parseInt($(tds[1]).find('input').val());
  newData.y = parseInt($(tds[2]).find('input').val());
  newData.z = parseInt($(tds[3]).find('input').val());
  newData.rx = parseInt($(tds[4]).find('input').val());
  newData.ry = parseInt($(tds[5]).find('input').val());
  newData.rz = parseInt($(tds[6]).find('input').val());
  newData.visible = $(tds[7]).find('input').is(':checked');
  tool.updateRoomElement(newData);
}

/* extrae los datos del editor de piezas y lo envia al visor 3d para actualizar la pieza */
function updatePiece(){
  if ( $("#piece-editor-model").html().length <=0 ){
    return false;
  }
  var newData = getPieceEditorData();
  updatePieceOnList(newData);
  tool.updatePiece(newData);
}

function updatePieceOnList(data){
  $('table[data-model="'+data.model+'"]').bootstrapTable('updateRow', data.index, data);
}


/* obtiene la informacion completa de la textura segun su nombre */
function getTextureByName(name){
  for (var i = 0; i < appData.textures.length; i++) {
    if (appData.textures[i].name == name) {
      return appData.textures[i];
    }
  }
}

/* generate a random string id for room elements*/
function stringGen(len){
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < len; i++ )
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
}


/* rellena las opcion del elemento select en el editor de piezas */
function fillTextureSelect(data){
  var element = $('#piece-editor select[name="texture"]');
  for (var i = 0; i < data.length; i++) {
    data[i].index = i;
    element.append('<option data-index="'+data[i].index+'" value="'+data[i].src+'"> ' + data[i].name  + '</option>');
  }
}


/* rellena las opcion del elemento select en el editor habitacion */
function fillRoomObjectSelect(data){
  var element = $('#object-editor-select');
  for (var i = 0; i < data.length; i++) {
    element.append('<option data-index="'+i+'" value="'+data[i].name+'"> ' + data[i].name  + '</option>');
  }
}

function initPiecesTable(){
  return $('#table-pieces').bootstrapTable({
    onClickRow: onPiecesRowClick,
    classes: 'table table-no-bordered table-hover ',

    uniqueId: 'index',
    columns: [{
        field: 'index',
        title: '#',
        visible: false,
        formatter: function(value, row, index){
          return value + 1;
        }
    }, {
        field: 'name',
        title: 'Nombre'
    }, {
        field: 'visible',
        title: '<span class="glyphicon glyphicon-eye-open"></span>',
        formatter: function(value){
          if (value)
            return '<span class="glyphicon-visible glyphicon glyphicon-eye-open"></span>';
          return '<span class="text-muted glyphicon-visible glyphicon glyphicon-eye-close"></span>';
        }
    }],
  });
}

function initModelsTable(){
  return $('#table-models').bootstrapTable({
    onClickRow: onModelsRowClick,
    classes: 'table table-no-bordered table-hover',
    uniqueId: 'guid',
    sortName: 'tag',
    columns: [{
        field: 'guid',
        title: '#',
        visible: false,
    }, {
        field: 'tag',
        title: 'Nombre'
    }, {
        field: 'visible',
        title: '<span class="glyphicon glyphicon-eye-open"></span>',
        formatter: function(value){
          if (value)
            return '<span class="glyphicon-visible glyphicon glyphicon-eye-open"></span>';
          return '<span class="text-muted glyphicon-visible glyphicon glyphicon-eye-close"></span>';
        }
    }],
  });
}

function onPiecesRowClick(piece, element, field){
  // si el click fue sobre el boton de visibilidad
  if (field == 'visible'){
    piece.visible = !piece.visible;
    editor.updatePiece(piece);
  }
  else
    editor.selectPiece(piece);
}

function onModelsRowClick(model, element, cell){
  // si el click fue sobre el boton de visibilidad
  if (cell == 'visible'){
    model.visible = !model.visible;
    editor.updateModel(model);
  }
  else
    editor.selectModel(model);
}

function getRoomObjectsAvaliable(){
  return [
    {
      "name" : "simple_door",
      "filename" : "basic_door.obj"
    },
    {
      "name" : "basic_window",
      "filename" : "basic_window.obj"
    }
  ];
}

function log(type, message){
  var type = type || 'default';
  $('#console').append('<p class="text-'+type+'">'+message+'</p>');
}
