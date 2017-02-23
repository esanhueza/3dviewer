var scene = new THREE.Scene();
scene.background = new THREE.Color( 0xf2f2f2 );
var viewerSection = document.getElementById('3d-section');
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var materials = {};
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
viewerSection.appendChild( renderer.domElement );
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();

// GUI VARS
var selectedItemIndex;
var items = document.getElementsByClassName("mesh-item");
var form = document.getElementById("mesh-form");
form.addEventListener('change', updateMesh);
window.addEventListener( 'click', onMouseClick, false );

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
var meshes = [];
var wireframes = [];
updateMeshList();

materials['wood'] = new THREE.MeshPhongMaterial( {
  color: 0xeaa04b,
  emissive: 0xeaa04b,
  side: THREE.FrontSide,
  shading: THREE.FlatShading,
  vertexColors: THREE.FaceColors
} )
materials['wireframe'] = new THREE.LineBasicMaterial({
  color: 0x000000,
  linewidth: 3
})

camera.position.y = 30;
camera.position.z = 40;
camera.rotation.x = -0.6;

// Object by which the camera ratates around
var pivot = new THREE.Object3D();
pivot.position.x = 10.5;
pivot.add(camera)
scene.add(pivot);

// Creating meshes
for (var i = 0; i < data.length; i++) {
  var piece = data[i];
  var geometry = new THREE.BoxGeometry( piece.w, piece.h, piece.l );
  var wireframeGeometry = new THREE.EdgesGeometry( geometry );
  var pieceMesh = new THREE.Mesh(geometry, materials[piece.material]);
  var wireframe = new THREE.LineSegments( wireframeGeometry, materials['wireframe'] );

  pieceMesh.position.x = piece.x + piece.w/2;
  pieceMesh.position.y = piece.y + piece.h/2;
  pieceMesh.position.z = piece.z + piece.l/2;

  wireframe.position.x = piece.x + piece.w/2 ;
  wireframe.position.y = piece.y + piece.h/2;
  wireframe.position.z = piece.z + piece.l/2;
  pieceMesh.tag = piece.tag;
  pieceMesh.dataIndex = i;
  scene.add(pieceMesh);
  scene.add(wireframe);
  meshes.push(pieceMesh);
  wireframes.push(wireframe);
}






function render() {
	requestAnimationFrame( render );
	renderer.render( scene, camera );
  pivot.rotation.y += 0.01;
}
render();


function createLine(){
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  geometry.vertices.push(new THREE.Vector3(0, 30, 0));
  var line = new THREE.Line(geometry, materials['wireframe']);
  scene.add(line);
  return line
}




function onMouseClick( event ){
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  // update the picking ray with the camera and mouse position
	raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects( scene.children );
  for (var i = 0; i < intersects.length; i++) {
    if (intersects[i].object.tag){
      document.getElementById('piece-name').innerHTML = intersects[i].object.tag;
      selectedItemIndex = intersects[i].object.dataIndex;
      updateForm(selectedItemIndex);
    }
  }
}




for (var i = 0; i < items.length; i++) {
    items[i].addEventListener('click', function(){
      var index = this.getAttribute('data-index');
      selectedItemIndex = index;
      updateForm(index);
    }, false);
}

function updateForm(index){
  form.elements['width'].value = data[index].w ;
  form.elements['height'].value = data[index].h;
  form.elements['long'].value = data[index].l;
  form.elements['x'].value = data[index].x;
  form.elements['y'].value = data[index].y;
  form.elements['z'].value = data[index].z;
}



function updateMesh(){
  if (!selectedItemIndex) return false;
  meshes[selectedItemIndex].position.x = parseFloat(form.elements['x'].value) + data[selectedItemIndex].w/2;
  meshes[selectedItemIndex].position.y = parseFloat(form.elements['y'].value) + data[selectedItemIndex].h/2;
  meshes[selectedItemIndex].position.z = parseFloat(form.elements['z'].value) + data[selectedItemIndex].l/2;
  wireframes[selectedItemIndex].position.x = parseFloat(form.elements['x'].value) + data[selectedItemIndex].w/2;
  wireframes[selectedItemIndex].position.y = parseFloat(form.elements['y'].value) + data[selectedItemIndex].h/2;
  wireframes[selectedItemIndex].position.z = parseFloat(form.elements['z'].value) + data[selectedItemIndex].l/2;

  var color = form.elements['color'].value;
  for ( var i = 0; i < meshes[selectedItemIndex].geometry.faces.length; i ++ ) {
    meshes[selectedItemIndex].geometry.faces[ i ].color.setHex(   0xffffff );
  }
  meshes[selectedItemIndex].geometry.colorsNeedUpdate = true;
}

function updateMeshList(){
  var list = document.getElementById('mesh-list');
  list.innerHTML = '';
  for (var i = 0; i < data.length; i++) {
    list.innerHTML += '<li class="mesh-item" data-index="'+i+'">'+data[i].tag+'</li>';
  }
}
