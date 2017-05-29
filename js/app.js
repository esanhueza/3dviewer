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
var piecesTable = $('#pieces-table');
var modelsTable = $('#models-table');
var roomTable   = $('#room-table');
var filename;
var appData = {};
var resourceManager = null;


// Se crea el visor 3D
var tool = ViewerTool.viewer;
tool.init(viewerSection);

//loadList();

/*
 * inicializa la aplicacion cuando la informacion externa fue cargada
 */
function initApp(){
  fillModelsGuids();
  // obtiene las texturas disponibles
  var resourceManager = new GoogleResourceManager();
  resourceManager.getTextureList(function(texturesList){
    appData.textures = texturesList;
    tool.loadTextures(texturesList);
    // rellena select de textura en el editor de pieza
    fillTextureSelect(texturesList);
  });
  appData['roomObjects'] = getRoomObjectsAvaliable();
  fillRoomObjectSelect( appData['roomObjects'] );
  tool.setAvaliableObjects( appData['roomObjects'] );

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

initApp();


/**
 *  On load, called to load the auth2 library and API client library.
 */
  // function handleClientLoad() {
  //
  // gapi.load('client:auth2', function(){
  //   var clientId = '498953387759-q8ehh29573e69rj3hbv99ofuma3ue6mn.apps.googleusercontent.com';
  //   resourceManager = new GoogleResourceManager(clientId);
  //   resourceManager.onLoad = function(){
  //     //initApp();
  //   }
  //   resourceManager.initClient();
  // });
  // }

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
    $("#models-load-tab .spinner").show();
    $("#models-load-tab .content").hide();
    $("#bar-progress").show();
  }
  else{
    $("#models-load-tab .spinner").hide();
    $("#models-load-tab .content").show();
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

    // first look if the model is already loaded
    for (var k = 0; k < rows.length; k++) {
      var e = $(rows[k]);
      // if is already loaded, remove it and load it again
      if (e.attr("data-guid") == guid){
        var tag = "MOD" + (guidList.indexOf(guid)+1);

        tool.removeModel(tag);
        e.remove();
        $('#'+tag+'Tab').remove();
        $('#nav-'+tag).remove();
      }
    }

    $.get({
      modelGuid: guid,
      modelIndex: i,
      url: "https://spreadsheets.google.com/feeds/list/" + guid + "/od6/public/full?alt=json",
      success: function(response) {
        var len = response.feed.entry.length;
        var parsedData = [];
        var data = response.feed.entry;
        filename = data[0].gsx$i.$t + "_" + data[0].gsx$j.$t + "_" + data[0].gsx$k.$t;

        for (var i = 2; i < data.length; i++) {
          var obj = data[i];
          if (obj.gsx$b.$t.length == 0) continue;
          var pieceData = {
              name: obj.gsx$b.$t,
              l: parseFloat(obj.gsx$d.$t.replace(',', '.')),
              w: parseFloat(obj.gsx$e.$t.replace(',', '.')),
              h: parseFloat(obj.gsx$f.$t.replace(',', '.')),
              orientation: parseInt(obj.gsx$g.$t),
              color: '0x' + obj.gsx$h.$t.replace(' ', ''),
              y: parseFloat(obj.gsx$i.$t.replace(',', '.')),
              x: parseFloat(obj.gsx$j.$t.replace(',', '.')),
              z: parseFloat(obj.gsx$k.$t.replace(',', '.')),
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

        var model = {guid:this.modelGuid, tag: "MOD" + (guidList.indexOf(this.modelGuid)+1), x:0, y:0, z:0, rx:0, ry:0,rz:0,visible:true, texture:null};
        addPiecesList(parsedData, model.tag);

        tool.addModel({tag: model.tag, pieces:parsedData});
        addModel(model);

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
function addModel(model){
  var html = '<tr data-guid="'+model.guid+'">' +
      '<td class="col-sm-2">'+model.tag+'</td>'+
      '<td class="col-sm-1"><input type="number" size="1" step="0.1" value="'+model.x+'" placeholder="X"></td>' +
      '<td class="col-sm-1"><input type="number" size="1" step="0.1" value="'+model.y+'" placeholder="Y"></td>' +
      '<td class="col-sm-1"><input type="number" size="1" step="0.1" value="'+model.z+'" placeholder="Z"></td>' +
      '<td class="col-sm-1"><input type="number" size="1" step="0.1" value="'+model.rx+'" placeholder="X"></td>' +
      '<td class="col-sm-1"><input type="number" size="1" step="0.1" value="'+model.ry+'" placeholder="Y"></td>' +
      '<td class="col-sm-1"><input type="number" size="1" step="0.1" value="'+model.rz+'" placeholder="Z"></td>' +
      '<td><input type="checkbox" name="visible" checked></td>' +
      '<td><div class="btn-group" role="group"><button class="btn btn-default btn-remove-model"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>'+
      '</div></td>';
  html += '</tr>';
  modelsTable.append(html);
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
function updatePiece(evt){
  var newData = getPieceEditorData();
  updatePieceOnList(newData);
  tool.updatePiece(newData);
}

function updatePieceOnList(data){
  var row = $('#pieces-table-' + data.modelId + ' tbody tr:nth-child('+(parseInt(data.index)+1)+') td');
  $(row[2]).html(data.w);
  $(row[3]).html(data.h);
  $(row[4]).html(data.l);
  $(row[5]).html(data.x);
  $(row[6]).html(data.y);
  $(row[7]).html(data.z);
  $(row[8]).find('div').css('background', data.color.replace('0x', '#'));
  $(row[8]).attr('data-color', data.color.replace('0x', '#'));
  $(row[9]).html(orientationList[data.orientation]);
  $(row[10]).html(data.visible ? 'visible' : 'oculto');
  $(row[11]).html(data.texture ? data.texture.name : '');
  $(row[12]).html(data.wireframe ? 'visible' : 'oculto');
}

// crea una nueva tabla para las piezas del modelo cargado
function addPiecesList(data, modelId){
  $('#nav-models').append('<li id="nav-'+modelId+'"role="presentation"><a href="#'+modelId+'Tab" aria-controls="'+modelId+'Tab" role="tab" data-toggle="tab">'+modelId+'</a></li>')
  $('#tab-content-models').append('<div role="tabpanel" class="tab-pane" id="'+modelId+'Tab"></div>')
  var newTable = piecesTable.clone();
  for (var i = 0; i < data.length; i++) {
    var html = '<tr>' +
        '<td>'+(i+1)+'</td>'+
        '<td data-model-id="'+modelId+'">'+data[i].name+'</td>'+
        '<td>'+data[i].w+'</td>' +
        '<td>'+data[i].h+'</td>' +
        '<td>'+data[i].l+'</td>' +
        '<td>'+data[i].x+'</td>' +
        '<td>'+data[i].y+'</td>' +
        '<td>'+data[i].z+'</td>' +
        '<td data-color="'+data[i].color.replace('0x', '#')+'"><div class="color-box" style="background:'+data[i].color.replace('0x', '#')+'"></td>'+
        '<td>' + orientationList[data[i].orientation] + '</td>'+
        '<td>visible</td>' +
        '<td>'+ (data[i].texture == undefined ? '' : data[i].texture.name) + '</td>' +
        '<td style="display:none">visible</td>';
    html += '</td></tr>';
    $('#'+modelId+'Tab').append(newTable);
    newTable.find("tbody").append(html);
    newTable.attr('id', 'pieces-table-' + modelId);
    newTable.show();
  }
}

/* obtiene los datos desde el editor de piezas */
function getPieceEditorData(){
  data = {};
  data.index = $("#piece-editor-index").html();
  data.modelId = $("#piece-editor-model").html();
  data.tag = $("#piece-editor-tag").html();
  data.w = parseInt($("#piece-editor-width").val());
  data.h = parseInt($("#piece-editor-height").val());
  data.l = parseInt($("#piece-editor-length").val());
  data.x = parseInt($("#piece-editor-x").val());
  data.y = parseInt($("#piece-editor-y").val());
  data.z = parseInt($("#piece-editor-z").val());
  data.visible = $("#piece-editor-visible").is(':checked');
  data.wireframe = $("#piece-editor-wireframe-visible").is(':checked');
  var textureIndex = $("#piece-editor-texture option:selected").attr('data-index');
  data.texture = textureIndex >= 0 ? appData.textures[textureIndex] : undefined;
  var color = $("#piece-editor-color").val();
  data.color = '0x' + color.replace(/[ #]/g, '');
  data.orientation = parseInt($("#piece-editor-orientation").val());
  return data;
}

/* Actualiza el editor de pieza cuando el usuario da click en una pieza de la lista. */
function setPieceEditorData(evt){
  var row = $(evt.currentTarget).children();
  $("#piece-editor-index").html(parseInt($(row[0]).html())-1);
  $("#piece-editor-tag").html($(row[1]).html());
  $("#piece-editor-model").html($(row[1]).attr('data-model-id'));
  $("#piece-editor-width").val($(row[2]).html());
  $("#piece-editor-height").val($(row[3]).html());
  $("#piece-editor-length").val($(row[4]).html());
  $("#piece-editor-x").val($(row[5]).html());
  $("#piece-editor-y").val($(row[6]).html());
  $("#piece-editor-z").val($(row[7]).html());
  $("#piece-editor-color").val($(row[8]).attr('data-color'));
  $("#piece-editor-orientation").val(orientationList.getKey($(row[9]).html()));
  $("#piece-editor-visible").prop('checked', $(row[10]).html() == 'visible');
  var texture = getTextureByName($(row[11]).html())
  $("#piece-editor-wireframe-visible").prop('checked', $(row[12]).html() == 'visible');
  $("#piece-editor-texture").val(texture ? texture.src : '-1');
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
  var element = $('#piece-editor-texture');
  for (var i = 0; i < data.length; i++) {
    element.append('<option data-index="'+i+'" value="'+data[i].src+'"> ' + data[i].name  + '</option>');
  }
}

/* rellena las opcion del elemento select en el editor habitacion */
function fillRoomObjectSelect(data){
  var element = $('#object-editor-select');
  for (var i = 0; i < data.length; i++) {
    element.append('<option data-index="'+i+'" value="'+data[i].name+'"> ' + data[i].name  + '</option>');
  }
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
