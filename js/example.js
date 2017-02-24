// TOOLS VARS
var viewerSection = document.getElementById('viewer');
var materials = {};

// GUI VARS
var selectedItemIndex;
var items = document.getElementsByClassName("mesh-item");
var form = document.getElementById("mesh-form");
var table = $('#meshes-table tbody');

// DATA VARS
var data = [
  {
    tag : 'piece1',
    w : 20,
    h : 1,
    l : 5,
    x : 1,
    y : 2,
    z : 0,
    material : 'wood',
  },
  {
    tag : 'piece2',
    w : 20,
    h : 1,
    l : 5,
    x : 1,
    y : 8,
    z : 0,
    material : 'wood',
  },
  {
    tag : 'piece3',
    w : 20,
    h : 1,
    l : 5,
    x : 1,
    y : 14,
    z : 0,
    material : 'wood',
  },
  {
    tag : 'piece4',
    w : 20,
    h : 1,
    l : 5,
    x : 1,
    y : 20,
    z : 0,
    material : 'wood',
  },
  {
    tag : 'piece5',
    w : 1,
    h : 22,
    l : 5,
    x : 0,
    y : 0,
    z : 0,
    material : 'wood',
  },
  {
    tag : 'piece6',
    w : 1,
    h : 22,
    l : 5,
    x : 21,
    y : 0,
    z : 0,
    material : 'wood',
  },
];
var tool = ViewerTool.viewer;
tool.init(viewerSection);
tool.createPieces(data);

updateMeshList();








document.getElementById('grid-check').addEventListener('change', function(e){
  tool.toggleGrid(this.checked);
})

$('#meshes-table tbody').on('change', 'tr td input', updateMesh);



function updateMesh(evt){
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
  newData.color = $(row[8]).find('input').val();
  tool.updateMesh(index, newData);

}

function updateMeshList(){
  for (var i = 0; i < data.length; i++) {
    var html = '<tr>' +
        '<td>'+(i+1)+'</td><td><input type="text" size="10" maxlength="6" value="'+data[i].tag+'"></td>'+
        '<td><input type="number" size="1" value="'+data[i].w+'"></td>' +
        '<td><input type="number" size="1" value="'+data[i].h+'"></td>' +
        '<td><input type="number" size="1" value="'+data[i].l+'"></td>' +
        '<td><input type="number" size="1" value="'+data[i].x+'"></td>' +
        '<td><input type="number" size="1" value="'+data[i].y+'"></td>' +
        '<td><input type="number" size="1" value="'+data[i].z+'"></td>' +
        '<td><input type="color" name="color">'+
        '<td><select><option> Horizontal </option></select>';
    html += '</td></tr>';
    table.append(html);
  }
}
