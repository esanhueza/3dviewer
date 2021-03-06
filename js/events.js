
$('#piece-scale').on('change', function (){
    tool.setPieceScale(this.value);
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

$('#input-light-bias').on('change', function (evt){
    tool.room.light.shadow.bias = $(evt.currentTarget).val() ;
});

$('#btn-export-pattern').on('click', function(){
  editor.exportPattern();
});



$('#btn-export').on('click', function(){
  $("#models-load-tab .spinner").show();
  $("#models-load-tab .content").hide
  tool.exportToObj.call(tool, filename, function(){
    $("#models-load-tab .spinner").hide();
    $("#models-load-tab .content").show();
  });
});

$('#btn-google-export').on('click', function(){
  var obj = tool.getCurrentObj.call(tool);
  resourceManager.uploadObj(filename, obj);
});

$('#btn-export-img').on('click', function(){
  var img = tool.exportIMG.call(tool, filename);
});
$('#btn-google-export-img').on('click', function(){
  var img = tool.getCurrentIMG.call(tool);
  resourceManager.uploadImg(filename, 'image/jpeg', img);
});
$('#btn-google-export-gif').on('click', function(){
  tool.getCurrentGIF.call(tool, function(blob){
     var reader = new window.FileReader();
     reader.readAsDataURL(blob);
     reader.onloadend = function() {
     base64data = reader.result;
     resourceManager.uploadImg(filename, 'image/gif', base64data);
   }
  });
});


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
  updateProgress(0);
  tool.exportGIF.call(tool, filename, function(total, current){
    updateProgress(current/total*100);
  });
});

$('.viewer-options').on('change', 'input', function(){
  editor.updateViewer();
})

$('.camera-view-option').change(function(evt){
  var value = $(evt.currentTarget).is(':checked');
  $('.camera-view-option').removeProp('checked');
  if (value){
    $(evt.currentTarget).prop('checked', 'checked');
  }
  editor.updateCamera();
})

$('#btn-create-room').on('change', function (evt){
  if ($(this).is(':checked')){
    var params = {};
    var w = $("#input-room-width").val();
    var h = $("#input-room-height").val();
    var l = $("#input-room-length").val();
    params.wallColor  = $('#input-wall-color').val();
    params.ceilColor  = $('#input-ceil-color').val();
    params.floorColor = $('#input-floor-color').val();
    tool.createRoom(w,h,l,params)
    $("#input-main-light").val(0.5);
    $("#input-main-light").trigger('change');
    $('#room-attributes').show();
  }
  else{
    $('#room-attributes').hide();
    tool.removeRoom();
  }
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
