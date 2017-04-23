// PARAMETERS
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

var guidList = ['1Io9jL33nJIm5jZVzr5UtQTqny-1IRmnOLO2XK-ZOSjE',
                '1MIhfTaNwC2Ke9yaPg9Ptow9cp7FnuQcc24rC8271HDo',
                '1CSBpyEWJ2-9nrB_a6cLML2oj8r9qDN1lxNNdFNu0uPY',
                '1JPuNPxzzhro2b_xXLNkeLI-5Il8h0fNKbjpBMnSST68',
                '1W_Wf_Az9_uCMesv2fxr3xWhBHRUPwVcAqcgSkabM7-8',
                '1anzJdB2JDuTiIq5YXPuz6dygNcTcLe4Z6iHYy0sKmT8',
                '1yl8vGarnbzhXMBk_5vF7E2rZlQtw70E5WWec09x_5Pg',
                '1VWGHCpsyJ-oMFnDxJnpp64BB5QBkix_ehJNFMD3u1H4',
                '1G_dq8XNSpLsK5LgQAEfOLtvHuf4NpNU2LobW0JH6vLg',
                '1omGhESDYyaz4cnay8W9Azk3brT6iePER9eCDuufZ48A'];

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
var table = $('#pieces-table');
var modelsTable = $('#models-table');
var filename;
// Se crea el visor 3D
var tool = ViewerTool.viewer;
tool.init(viewerSection);


// Se conectan los eventos con las acciones de visor
$('#grid-check').on('change', function (){
    tool.toggleGrid(this.checked);
});
$('#piece-scale').on('change', function (){
    tool.setPieceScale(this.value);
    console.log(this.value);
});

$('#rotate-check').on('change', function (){
    tool.toggleRotation(this.checked);
});
// $('#model-spreadsheet').on('change', function (){
//   loadModel(this.value);
// });
$('#btn-load-all').on('click', function (){
  for (var i = 0; i < guidList.length; i++) {
    loadModel(guidList[i]);
  }
});

$('#fixed-camera-check').on('change', function (){
    tool.toggleFixedCamera(this.checked);
});

$('#meshes-visibility-check').on('change', function (){
    tool.togglePiecesVisibility(!this.checked);
});

$('#edge-color').on('change', function (){
    tool.setEdgeColor(this.value.replace('#','0x'));
});

$('#btn-export').on('click', function(){
  tool.exportToObj.call(tool, filename);
});

$('#btn-export-img').on('click', function(){
  tool.exportIMG.call(tool, filename);
});

var actionInterval;
var isMouseDown;
var previousMousePosition;
$('#btn-rotate-left').click(function(){
  tool.rotate.call(tool, -0.4);
});


$('#btn-rotate-right').click(function(){
  tool.rotate.call(tool, 0.4);
});

$('#btn-look-at').click(function(){
  tool.lookAtCenter.call(tool);
});

$('#btn-zoom-in').click(function(){
  tool.zoom.call(tool, -1);
});

$('#btn-zoom-out').click(function(){
  tool.zoom.call(tool, 2);
});


$(viewerSection).mousemove(function(e){
  if (isMouseDown){
    var deltaMove = {
      x: e.offsetX - previousMousePosition.x,
      y: e.offsetY - previousMousePosition.y,
    }
    viewer.moveCamera(deltaMove);
  }

  previousMousePosition = {
    x: e.offsetX,
    y: e.offsetY
  }
}).mousedown(function(){
  isMouseDown = true;
}).mouseup(function(){
  isMouseDown = false;
});


$('#tab-content-models').on('change', '.tab-pane tbody tr td input, .tab-pane tbody tr td select', updatePiece);
$('#models-table tbody').on('change', 'tr td input, tr td select', updateModel);
$('#models-table tbody').on('click', '.btn-remove-model', function(){
  var row = $(this).parentsUntil('tbody');
  var guid = row[row.length-1].attr('data-guid')
  console.log(guid);
});
$('#models-table tbody').on('click', '.btn-edit-model', function(){
  console.log("btn-edit-model");
});

$('#btn-load').on('click', function(){
  loadModel($("#model-spreadsheet")[0].value)
});
$('#btn-export-gif').on('click', function(){
  tool.exportGIF.call(tool, filename);
});


loadList();
loadGuids();

function loadGuids(){
  for (var i = 1; i <= guidList.length; i++) {
    var select = $('#model-spreadsheet');
    select.append('<option value='+guidList[i-1]+'>MOD'+(i) +'</option>')

  }


}

function loadList(){
  var select = $('#link-model-spreadsheet');
  // if (!match){
  //   $(this).before(
  //     '<div id="alert-load" class="alert alert-danger fade in" role="alert">'+
  //     '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>' +
  //     '<h4>Error al cargar los datos!</h4>' +
  //     '<p>Compruebe que el link ingresado es correcto.</p>'+
  //     '<p>Recuerda que debe ser publicado a la web (Archivo -> Publicar a la Web).</p>'+
  //     '</div>')
  //   return false;
  // }

  if (QueryString.model != undefined){
    if (parseInt(QueryString.model) > guidList.length){
      console.log("Modelo seleccionado no valido.");
      return
    }

    console.log("Cargando modelo.");
    currentGuid = guidList[QueryString.model-1];
    loadModel(currentGuid);
  }


}

// carga la información desde una hoja especifica (guid) del spreadsheet
function loadModel(guid){

  var rows = modelsTable.find('tbody').children();
  for (var i = 0; i < rows.length; i++) {
    var e = $(rows[i]);
    if (e.attr("data-guid") == guid){
      var tag = "MOD" + (guidList.indexOf(guid)+1);
      tool.removeModel({tag: tag});
      e.remove();
      $('#'+tag+'Tab').remove();
      $('#nav-'+tag).remove();
      break
    }

  }
  console.log("https://spreadsheets.google.com/feeds/list/" + guid + "/od6/public/full?alt=json");
  $.get({
    url: "https://spreadsheets.google.com/feeds/list/" + guid + "/od6/public/full?alt=json",
    success: function(response) {
      var len = response.feed.entry.length;
      var parsedData = [];
      var data = response.feed.entry;
      filename = data[0].content.$t.split(', ')[6].split(':')[0] + ' ' +
                     data[0].content.$t.split(', ')[7].split(':')[0] + ':' +
                     data[0].content.$t.split(', ')[8].split(':')[0];
      for (var i = 1; i < len; i++) {
        var obj = data[i].content.$t.split(', ')
        // ignore column 1, is empty
        if (obj.length >= 9){
          parsedData.push({
            name: obj[0].split(':')[1],
            l: parseFloat(obj[1].split(':')[1].replace(',', '.')),
            w: parseFloat(obj[2].split(':')[1].replace(',', '.')),
            h: parseFloat(obj[3].split(':')[1].replace(',', '.')),
            orientation: parseInt(obj[4].split(':')[1]),
            color: '0x' + obj[5].split(':')[1].replace(' ', ''),
            y: parseFloat(obj[6].split(':')[1].replace(',', '.')),
            x: parseFloat(obj[7].split(':')[1].replace(',', '.')),
            z: parseFloat(obj[8].split(':')[1].replace(',', '.')),
          });
        }
        else{
          if (obj.length > 1 ){
            //console.log('Piece ' + data[i].title.$t + ' is missing data.');
          }
        }
      }
      // se actualiza la informacion en el visor y en la tabla de piezas

      var model = {guid:guid, tag: "MOD" + (guidList.indexOf(guid)+1), x:0, y:0, z:0, orientation:1,visible:true};

      addPiecesList(parsedData, model.tag);
      tool.addModel({tag: model.tag, pieces:parsedData});
      addModel(model);
    }
  });
}

// Agrega un modelo a la tabla de modelos
function addModel(model){
  var html = '<tr data-guid="'+model.guid+'">' +
      '<td>'+model.tag+'</td>'+
      '<td><input type="number" size="1" step="0.1" value="'+model.x+'"></td>' +
      '<td><input type="number" size="1" step="0.1" value="'+model.y+'"></td>' +
      '<td><input type="number" size="1" step="0.1" value="'+model.z+'"></td>' +
      '<td><select>' +
      '<option value="1" '+ (model.orientation==1 ? 'selected' : '') +'> Vertical de corte </option>' +
      '<option value="2" '+ (model.orientation==2 ? 'selected' : '') +'> Horizontal de corte </option>' +
      '<option value="3" '+ (model.orientation==3 ? 'selected' : '') +'> Vertical de frente </option>' +
      '<option value="4" '+ (model.orientation==4 ? 'selected' : '') +'> Horizontal de frente </option>' +
      '</select></td>' +
      '<td><input type="checkbox" name="visible" checked></td>' +
      '<td><div class="btn-group" role="group"><button class="btn btn-default btn-remove-model"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>'+
      '<button class="btn btn-default btn-edit-model"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button></div></td>';
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
  newData.orientation = parseInt($(row[4]).find('select').val());
  newData.visible = $(row[5]).find('input').is(':checked');
  tool.updateModel(newData);
}

function updatePiece(evt){
  var row = $(evt.target.parentElement.parentElement).children();
  newData = {};
  index = $(row[0]).html() - 1;
  newData.tag = $(row[1]).find('input').val();
  newData.w = parseInt($(row[2]).find('input').val());
  newData.h = parseInt($(row[3]).find('input').val());
  newData.l = parseInt($(row[4]).find('input').val());
  newData.x = parseInt($(row[5]).find('input').val());
  newData.y = parseInt($(row[6]).find('input').val());
  newData.z = parseInt($(row[7]).find('input').val());
  newData.visible = $(row[10]).find('input').is(':checked');
  var color = $(row[8]).find('input').val();
  newData.color = '0x' + color.replace(/[ #]/g, '');
  newData.orientation = parseInt($(row[9]).find('select').val());
  var table = evt.target.parentElement.parentElement.parentElement.parentElement;
  var tag = $(table).attr('id').split('-')[2];
  tool.updatePiece(tag, index, newData);
}

function addPiecesList(data, tag){
  $('#nav-models').append('<li id="nav-'+tag+'"role="presentation"><a href="#'+tag+'Tab" aria-controls="'+tag+'Tab" role="tab" data-toggle="tab">'+tag+'</a></li>')
  $('#tab-content-models').append('<div role="tabpanel" class="tab-pane" id="'+tag+'Tab"></div>')
  var newTable = table.clone();
  for (var i = 0; i < data.length; i++) {
    var html = '<tr>' +
        '<td>'+(i+1)+'</td><td><input type="text" size="10" maxlength="6" value="'+data[i].name+'"></td>'+
        '<td><input type="number" size="1" step="0.1" value="'+data[i].w+'"></td>' +
        '<td><input type="number" size="1" step="0.1" value="'+data[i].h+'"></td>' +
        '<td><input type="number" size="1" step="0.1" value="'+data[i].l+'"></td>' +
        '<td><input type="number" size="1" step="0.1" value="'+data[i].x+'"></td>' +
        '<td><input type="number" size="1" step="0.1" value="'+data[i].y+'"></td>' +
        '<td><input type="number" size="1" step="0.1" value="'+data[i].z+'"></td>' +
        '<td><input type="color" name="color" value="'+data[i].color.replace('0x', '#')+'">'+
        '<td><select>' +
        '<option value="1" '+ (data[i].orientation==1 ? 'selected' : '') +'> Vertical de corte </option>' +
        '<option value="2" '+ (data[i].orientation==2 ? 'selected' : '') +'> Horizontal de corte </option>' +
        '<option value="3" '+ (data[i].orientation==3 ? 'selected' : '') +'> Vertical de frente </option>' +
        '<option value="4" '+ (data[i].orientation==4 ? 'selected' : '') +'> Horizontal de frente </option>' +
        '</select></td>' +
        '<td><input type="checkbox" name="visible" checked>';
    html += '</td></tr>';
    $('#'+tag+'Tab').append(newTable);
    newTable.find("tbody").append(html);
    newTable.attr('id', 'pieces-table-' + tag);
    newTable.show();
  }
}
