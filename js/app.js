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
                '1omGhESDYyaz4cnay8W9Azk3brT6iePER9eCDuufZ48A',
                // '1FD2-3Rmwkb8aYej56V4Kx4_HNsFn5ttdmY5Nj8VAF9g'
              ];



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
  $("#models-load-tab .spinner").show();
  $("#models-load-tab .content").hide
  tool.exportToObj.call(tool, filename, function(){
    $("#models-load-tab .spinner").hide();
    $("#models-load-tab .content").show();
  });
});

$('#btn-export-img').on('click', function(){
  tool.exportIMG.call(tool, filename);
});


$('#tab-content-models').on('change', '.tab-pane tbody tr td input, .tab-pane tbody tr td select', updatePiece);
$('#models-table tbody').on('change', 'tr td input, tr td select', updateModel);
$('#models-table tbody').on('click', '.btn-remove-model', function(){
  var row = $(this).parentsUntil('tbody');
  var guid = row.parent().attr('data-guid')
  tool.removeModel(guid)
});

$('#btn-load').on('click', function(){
  loadModel([$("#model-spreadsheet")[0].value])
});

$('#input-main-light').on('change', function(evt){
  tool.setLightIntensity($(evt.target).val());
});

$('#btn-load-all').on('click', function (){
  loadModel(guidList)
});

$('#btn-export-gif').on('click', function(){
  $("#models-load-tab .spinner").show();
  $("#models-load-tab .content").hide();
  tool.exportGIF.call(tool, filename, function(){
    $("#models-load-tab .spinner").hide();
    $("#models-load-tab .content").show();
  });
});


$('#btn-create-room').on('click', function (){
  var w = $("#input-room-width").val()
  var h = $("#input-room-height").val()
  var l = $("#input-room-length").val()
  tool.createRoom(w,h,l)
});

$('#btn-remove-room').on('click', function (){
  roomTable.find("tbody tr:not(.row-template)").remove();
  tool.removeRoom();
});

$('#btn-add-room-element').on('click', function (){
  if (!tool.room){
    $("#btn-create-room").trigger("click");
  }
  var template = roomTable.find(".row-template")[0];
  var newRow = $(template).clone();
  var tagInput = $($(newRow).find("td input")[0]);
  newRow.removeClass("row-template");
  newRow.show();
  tagInput.val(stringGen(10));
  roomTable.append(newRow);
});

$('#room-table').on('click', '.btn-remove-room-element, .btn-remove-room-element span', function (evt){
  var parents = $(evt.target).parentsUntil("tbody");
  var row = $(parents[parents.length-1]);
  var t = $(row.children()[0]).find('input').val();
  tool.removeRoomElement({tag:t});
  row.remove();
});

$('#room-table').on('change', 'tbody tr td input, tbody tr td select', updateRoomElement);


// room update events
$('#input-room-width, #input-room-height, #input-room-length').on('change', function (){
  var w = $("#input-room-width").val()
  var h = $("#input-room-height").val()
  var l = $("#input-room-length").val()
  tool.updateRoom({dimension:{
    width: w,height:h,length:l,
  }})
});

$('#input-wall-color, #input-ceil-color, #input-floor-color, #input-light-color, #input-light-intensity').on('change', function (){
  var wc = $("#input-wall-color").val()
  var fc = $("#input-floor-color").val()
  var cc = $("#input-ceil-color").val()
  var lightColor = $("#input-light-color").val()
  var lightIntensity = $("#input-light-intensity").val()
  tool.updateRoom({
    color:{
      wall: wc.replace("#", "0x"),
      floor: fc.replace("#", "0x"),
      ceil: cc.replace("#", "0x"),
    },
    light:{
      color: lightColor.replace("#", "0x"),
      intensity: lightIntensity,
    }
  })
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
    loadModel([currentGuid]);
  }


}

// carga la información desde una hoja especifica (guid) del spreadsheet
function loadModel(modelsToLoad){
  $("#models-load-tab .spinner").show();
  $("#models-load-tab .content").hide();

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
        tool.removeModel({tag: tag});
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
        filename = data[0].content.$t.split(', ')[6].split(':')[0] + ' ' +
                       data[0].content.$t.split(', ')[7].split(':')[0] + ':' +
                       data[0].content.$t.split(', ')[8].split(':')[0];
        for (var i = 1; i < len; i++) {
          var obj = data[i].content.$t.split(', ')

          // ignore column 1, is empty
          if (obj.length >= 9){
            var textureName = obj.length == 10 ? obj[9].split(': ')[1] : null;
            parsedData.push({
              name: obj[0].split(': ')[1],
              l: parseFloat(obj[1].split(': ')[1].replace(',', '.')),
              w: parseFloat(obj[2].split(': ')[1].replace(',', '.')),
              h: parseFloat(obj[3].split(': ')[1].replace(',', '.')),
              orientation: parseInt(obj[4].split(': ')[1]),
              color: '0x' + obj[5].split(': ')[1].replace(' ', ''),
              y: parseFloat(obj[6].split(': ')[1].replace(',', '.')),
              x: parseFloat(obj[7].split(': ')[1].replace(',', '.')),
              z: parseFloat(obj[8].split(': ')[1].replace(',', '.')),
              texture: textureName,
            });
          }
          else{
            if (obj.length > 1 ){
              //console.log('Piece ' + data[i].title.$t + ' is missing data.');
            }
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
          $("#models-load-tab .spinner").hide();
          $("#models-load-tab .content").show();
        }
    },

    error: function(response){
      console.log("error loading model");
      console.log(response);
    }
  });

  }
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
  var row = $(evt.target.parentElement.parentElement).children();
  newData = {};
  index = $(row[0]).html() - 1;
  newData.tag = $(row[0]).find('input').val();
  newData.type = $(row[1]).find('input').val();
  newData.x = parseInt($(row[2]).find('input').val());
  newData.y = parseInt($(row[3]).find('input').val());
  newData.z = parseInt($(row[4]).find('input').val());
  newData.rx = parseInt($(row[5]).find('input').val());
  newData.ry = parseInt($(row[6]).find('input').val());
  newData.rz = parseInt($(row[7]).find('input').val());
  newData.visible = $(row[8]).find('input').is(':checked');
  tool.updateRoomElement(newData);
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
  var piecesTable = evt.target.parentElement.parentElement.parentElement.parentElement;
  var tag = $(piecesTable).attr('id').split('-')[2];
  tool.updatePiece(tag, index, newData);
}

function addPiecesList(data, tag){
  $('#nav-models').append('<li id="nav-'+tag+'"role="presentation"><a href="#'+tag+'Tab" aria-controls="'+tag+'Tab" role="tab" data-toggle="tab">'+tag+'</a></li>')
  $('#tab-content-models').append('<div role="tabpanel" class="tab-pane" id="'+tag+'Tab"></div>')
  var newTable = piecesTable.clone();
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

function stringGen(len)
{
    var text = "";

    var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    console.log(text);
    return text;
}
