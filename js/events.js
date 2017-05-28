$('#grid-check').on('change', function (){
    tool.toggleGrid(this.checked);
});
$('#piece-scale').on('change', function (){
    tool.setPieceScale(this.value);
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


$('.piece-editor-item').on('change', updatePiece);
$('#tab-content-models').on('click', '.tab-pane table tbody tr', setPieceEditorData);



$('#models-table tbody').on('change', 'tr td input, tr td select', updateModel);
$('#models-table tbody').on('click', '.btn-remove-model', function(){
  var search = $(this).parentsUntil('tbody');
  var row = $(search[search.length-1]);
  var tag = $(row.children()[0]).html();
  tool.removeModel(tag);
  row.remove();
  $('#'+tag+'Tab').remove();
  $('#nav-'+tag).remove();
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
  $("#input-main-light").val(0.5);
  $("#input-main-light").trigger('change');

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
  newRow.attr('tag', stringGen(10))
  newRow.removeClass("row-template");
  newRow.show();
  var typeInput = newRow.children("td:first");
  typeInput.html($("#object-editor-select").val());
  roomTable.append(newRow);
  $('#room-table tbody tr:last td:nth-child(2) input').trigger('change');
  console.log($('#room-table tbody tr:last td:nth-child(2) input'));

});

$('#room-table').on('click', '.btn-remove-room-element, .btn-remove-room-element span', function (evt){
  var parents = $(evt.target).parentsUntil("tbody");
  var row = $(parents[parents.length-1]);
  var t = row.attr('tag');
  tool.removeRoomElement( { tag : t } );
  row.remove();
});

$('#room-table').on('change', 'tbody tr td input', updateRoomElement);

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
