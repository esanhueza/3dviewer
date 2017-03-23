var ViewerTool = {};

class Viewer {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xf2f2f2 );
    this.renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialiasing: true,
    });
    //this.renderer.setPixelRatio( window.devicePixelRatio );
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.grid = [];
    this.meshes = [];
    this.wireframes = [];
    this.centerPivot = new THREE.Object3D();
    this.group = new THREE.Group();
    this.autoRotate = false;
    this.fixCamera = false;
    this.materials = {
      'wood' : new THREE.MeshPhongMaterial( {
        color: 0xeaa04b,
        emissive: 0xeaa04b,
        side: THREE.FrontSide,
        shading: THREE.FlatShading,
        vertexColors: THREE.FaceColors,
        transparent: true,
        opacity: 0.9,
      } ),
      'wireframe' : new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 3,
      }),
      'grid' : new THREE.LineBasicMaterial({
        transparent: true,
        color: 0x000000,
        linewidth: 1,
        opacity: 0.2
      })
    };

    var self = this;
  }
  init(container){
    this.container = container;
    this.renderer.setSize( container.offsetWidth, container.offsetHeight );
    this.container.appendChild( this.renderer.domElement );
    this.camera = new THREE.PerspectiveCamera( 75, container.offsetWidth / container.offsetHeight, 0.1, 1000 );
    // Set camera position
    this.camera.position.y = 10;
    this.camera.position.z = 12;
    //this.camera.rotation.x = -0.4;
    // Object by which the camera ratates around
    this.centerPivot.add( this.camera )
    this.scene.add( this.centerPivot );
    this.scene.add( this.group );
    this.createGrid();
    render();
  }

  createPieces(data){
    this.data = data;
    // Creating meshes
    for (var i = 0; i < data.length; i++) {
      var result = this.createPiece(data[i]);
      result.piece.dataIndex = i;
      //this.scene.add(result.piece);
      //this.scene.add(result.wireframe);
      this.meshes.push(result.piece);
      this.wireframes.push(result.wireframe);

      this.group.add(result.piece);
      this.group.add(result.wireframe);
    }

    this.updatePivot();
  }

  updatePivot(){
    var box = new THREE.Box3();
    box.setFromObject( this.group );
    this.centerPivot.position.x = (box.max.x - box.min.x) / 2;
    this.centerPivot.position.y = (box.max.y - box.min.y) / 2;
    this.centerPivot.position.z = (box.max.z - box.min.z) / 2;
  }

  correctSize(data){
    var position;
    // rotate position Vector3
    if (data.orientation == 1){
      position = new THREE.Vector3(data.h, data.l, data.w);
    }
    else if (data.orientation == 2){
      position = new THREE.Vector3(data.l, data.h, data.w);
    }
    else if (data.orientation == 3){
      position = new THREE.Vector3(data.l, data.w, data.h);
    }
    else if (data.orientation == 4){
      position = new THREE.Vector3(data.w, data.l, data.h);
    }
    else{
      position = new THREE.Vector3(data.w, data.h, data.l);
    }

    data.x = data.x/200;
    data.y = data.y/200;
    data.z = data.z/200;
    data.w = Math.abs(position.x/200);
    data.h = Math.abs(position.y/200);
    data.l = Math.abs(position.z/200);
    return data;
  }
  createPiece(d){
    var data = this.correctSize(d);
    var geometry = new THREE.BoxGeometry( data.w, data.h, data.l );
    // var wireframeGeometry = new THREE.EdgesGeometry( geometry );
    var pieceMesh = new THREE.Mesh(geometry, this.materials[data.material]);
    var edges = new THREE.EdgesGeometry( geometry );
    var wireframe = new THREE.LineSegments( edges, this.materials['wireframe']) ;

    //var wireframe = new THREE.LineSegments( wireframeGeometry, this.materials['wireframe'] );

    pieceMesh.position.x = data.x + data.w/2;
    pieceMesh.position.y = data.y + data.h/2;
    pieceMesh.position.z = data.z + data.l/2;

    wireframe.position.x = data.x + data.w/2 ;
    wireframe.position.y = data.y + data.h/2;
    wireframe.position.z = data.z + data.l/2;

    pieceMesh.tag = data.name;
    pieceMesh.material.color.setHex(data.color);

    return {piece : pieceMesh, wireframe: wireframe};
  }

  updateMesh(index, data){
    this.meshes[index].parent.remove(this.meshes[index])
    this.wireframes[index].parent.remove(this.wireframes[index])
    var result = this.createPiece(data);
    result.piece.visible = data.visible;
    result.wireframe.visible = data.visible;
    result.piece.dataIndex = index;
    this.group.add(result.piece);
    this.scene.add(result.wireframe);
    this.meshes[index] = result.piece;
    this.wireframes[index] = result.wireframe;
    this.updatePivot();

  }

  setLineWidth(v){
  }

  setEdgeColor(v){
    this.materials['wireframe'].color.setHex(v);
  }


  getPiece(event){
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    this.mouse.x = ( event.layerX / this.container.offsetWidth ) * 2 - 1;
    this.mouse.y = - ( event.layerY / this.container.offsetHeight ) * 2 + 1;
    // update the picking ray with the camera and mouse position
  	this.raycaster.setFromCamera( this.mouse, this.camera );

  	// calculate objects intersecting the picking ray
  	var intersects = this.raycaster.intersectObjects( this.scene.children );
    for (var i = 0; i < intersects.length; i++) {
      if (intersects[i].object.tag){
        selectedItemIndex = intersects[i].object.dataIndex;
        return selectedItemIndex;
      }
    }
    return false;
  }

  createGrid(){
    for (var i = 0; i < 101; i++) {
      var line = this.createLine({x: -50 + i, y:0, z:-50}, {x: -50 + i, y:0, z:50})
      line.visible = false;
      this.grid.push(line);
      var line2 = this.createLine({x: -50, y: 0, z:-50 + i}, {x: 50, y: 0, z:-50 + i})
      line2.visible = false;
      this.grid.push(line2);
    }
  }
  toggleRotation(rotate){
    this.autoRotate = rotate;
  }

  createLine(s, d){
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(s.x, s.y, s.z));
    geometry.vertices.push(new THREE.Vector3(d.x, d.y, d.z));
    var line = new THREE.Line(geometry, this.materials['grid']);
    this.scene.add(line);
    return line
  }

  createOrigin(){
    this.createLine({x:0,y:0,z:0}, {x:10,y:0,z:0});
    this.createLine({x:0,y:0,z:0}, {x:0,y:3,z:0});
    this.createLine({x:0,y:0,z:0}, {x:0,y:0,z:3});
  }

  toggleGrid(show){
    for (var i = 0; i < this.grid.length; i++) {
      this.grid[i].visible = show;
    }
  }

  // create obj file with the meshes
  exportToObj(filename){
    var exporter = new THREE.OBJExporter();
    // remove wireframes and grid
    for (var i = 0; i < this.wireframes.length; i++) {
      this.wireframes[i].parent.remove(this.wireframes[i]);
    }
		var result = exporter.parse(this.group);
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(result));
    element.setAttribute('download', filename + '.obj');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    // add wireframes and grid
    for (var i = 0; i < this.wireframes.length; i++) {
      this.group.add(this.wireframes[i]);
    }
  }

  rotate(value){
    this.centerPivot.rotation.y += value;
  }

  zoom(value){
    this.camera.translateZ( value * 1 );
  }

  moveCamera(d){
    this.camera.translateX(-d.x / 100);
    this.camera.translateY(d.y / 100);
  }

  lookAtCenter(d){
    this.camera.lookAt({x:0,y:0,z:0});
  }

  toggleFixedCamera(v){
    this.fixCamera = v;
  }


  exportGIF(filename){
    var steps = 8;
    var exporter = new GIF({
      workers: 2,
      quality: 10,
      workerScript: 'js/gif.worker.js'
    });
    this.centerPivot.rotation.y = 0;
    for (var i = 0; i < steps; i++) {
      var element = document.createElement('img');
      this.rotate( i == 0 ? 0 : (45 * Math.PI / 180));
    	viewer.renderer.render( this.scene, this.camera );
      element.src = this.renderer.domElement.toDataURL('image/jpeg');
      exporter.addFrame(element);
    }

    exporter.on('finished', function(blob) {
      var result = document.createElement('a');
      result.setAttribute('href', window.URL.createObjectURL(blob)) ;
      result.setAttribute('download', filename + '.gif') ;
      result.style.display = 'none';
      document.body.appendChild(result);
      result.click();
      document.body.removeChild(result);
    });
    exporter.render();
  }

  exportIMG(filename){
    var result = document.createElement('a');
    result.setAttribute('href',  this.renderer.domElement.toDataURL('image/jpeg'));
    result.setAttribute('download', filename + '.jpeg') ;
    result.style.display = 'none';
    document.body.appendChild(result);
    result.click();
    document.body.removeChild(result);
  }
}

var viewer = new Viewer();
ViewerTool.viewer = viewer;

function render(){
	requestAnimationFrame( render );
	viewer.renderer.render( viewer.scene, viewer.camera );
  if (viewer.autoRotate){
    viewer.centerPivot.rotation.y += 0.01;
  }
  if (viewer.fixCamera)
    viewer.camera.lookAt({x:0,y:0,z:0});
}
