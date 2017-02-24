var ViewerTool = {};

class Viewer {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xf2f2f2 );
    this.renderer = new THREE.WebGLRenderer();
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.grid = [];
    this.meshes = [];
    this.wireframes = [];
    this.centerPivot = new THREE.Object3D();
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
        linewidth: 3
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
    this.camera.position.y = 30;
    this.camera.position.z = 40;
    this.camera.rotation.x = -0.6;
    // Object by which the camera ratates around
    this.centerPivot.position.x = 10.5;
    this.centerPivot.add( this.camera )
    this.scene.add( this.centerPivot );
    tool.createGrid();
    tool.createOrigin();
    render();
  }

  createPieces(data){
    this.data = data;
    // Creating meshes
    for (var i = 0; i < data.length; i++) {
      var piece = data[i];
      var geometry = new THREE.BoxGeometry( piece.w, piece.h, piece.l );
      var wireframeGeometry = new THREE.EdgesGeometry( geometry );
      var pieceMesh = new THREE.Mesh(geometry, this.materials[piece.material]);
      var wireframe = new THREE.LineSegments( wireframeGeometry, this.materials['wireframe'] );

      pieceMesh.position.x = piece.x + piece.w/2;
      pieceMesh.position.y = piece.y + piece.h/2;
      pieceMesh.position.z = piece.z + piece.l/2;

      wireframe.position.x = piece.x + piece.w/2 ;
      wireframe.position.y = piece.y + piece.h/2;
      wireframe.position.z = piece.z + piece.l/2;
      pieceMesh.tag = piece.tag;
      pieceMesh.dataIndex = i;
      this.scene.add(pieceMesh);
      this.scene.add(wireframe);
      this.meshes.push(pieceMesh);
      this.wireframes.push(wireframe);
    }
  }

  updateMesh(index, data){
    console.log("Update mesh: " + index + ", data: ", data);

    this.meshes[index].scale.x = data.w / this.data[index].w;
    this.meshes[index].scale.y = data.h / this.data[index].h;
    this.meshes[index].scale.z = data.l / this.data[index].l;

    this.meshes[index].position.x = data.x + data.w/2;
    this.meshes[index].position.y = data.y + data.h/2;
    this.meshes[index].position.z = data.z + data.l/2;

    this.wireframes[index].scale.x = data.w / this.data[index].w;
    this.wireframes[index].scale.y = data.h / this.data[index].h;
    this.wireframes[index].scale.z = data.l / this.data[index].l;
    this.wireframes[index].position.x = data.x + data.w/2;
    this.wireframes[index].position.y = data.y + data.h/2;
    this.wireframes[index].position.z = data.z + data.l/2;
  }

  highlightPiece(event){
    this.mouse.x = ( event.layerX / this.container.offsetWidth ) * 2 - 1;
    this.mouse.y = - ( event.layerY / this.container.offsetHeight ) * 2 + 1;
    this.raycaster.setFromCamera( this.mouse, this.camera );
    // calculate objects intersecting the picking ray
    var intersects = this.raycaster.intersectObjects( this.scene.children );
    for (var i = 0; i < intersects.length; i++) {
      if (intersects[i].object.tag){
        selectedItemIndex = intersects[i].object.dataIndex;
        this.meshes[selectedItemIndex].material.color.setHex( 0x878787 );
        return true;
      }
    }
    return false;

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
        console.log(intersects[i].object.tag);
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

  createLine(s, d){
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(s.x, s.y, s.z));
    geometry.vertices.push(new THREE.Vector3(d.x, d.y, d.z));
    var line = new THREE.Line(geometry, this.materials['grid']);
    this.scene.add(line);
    return line
  }

  createOrigin(){
    this.createLine({x:0,y:0,z:0}, {x:3,y:0,z:0});
    this.createLine({x:0,y:0,z:0}, {x:0,y:3,z:0});
    this.createLine({x:0,y:0,z:0}, {x:0,y:0,z:3});
  }

  toggleGrid(show){
    for (var i = 0; i < this.grid.length; i++) {
      this.grid[i].visible = show;
    }
  }
}

var viewer = new Viewer();
ViewerTool.viewer = viewer;

function render(){
	requestAnimationFrame( render );
	viewer.renderer.render( viewer.scene, viewer.camera );
  viewer.centerPivot.rotation.y += 0.01;
}
