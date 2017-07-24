var ViewerTool = {};

class Viewer {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xf2f2f2 );
    this.renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: true,
    });
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMapSoft = true;

    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.gridHelper = null;
    this.meshes = [];
    this.models = [];
    this.centerPivot = new THREE.Object3D();

    this.group  = new THREE.Group();
    this.labels = new THREE.Group();
    this.lights = new THREE.Group();
    this.group.castShadow = true;
    this.group.receiveShadow = true;
    this.scaleFactor = 0.1;
    this.group.scale.set(this.scaleFactor, this.scaleFactor, this.scaleFactor);

    this.autoRotate = false;
    this.fixCamera = false;
    this.pieceScale = 1;
    this.textures = {};
    this.roomObjects = [];
    this.textureSize = {width: 1830, height:2600}
    this.materials = {
      'wood' : new THREE.MeshPhongMaterial( {
        color: 0xffffff,
        side: THREE.FrontSide,
        shading: THREE.FlatShading,
        vertexColors: THREE.NoColors,
        reflectivity: .8,
      }),
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

  init(container, textures, roomObjects){
    this.container = container;
    this.renderer.setSize( container.offsetWidth, container.offsetHeight );
    this.container.appendChild( this.renderer.domElement );
    this.camera = new THREE.PerspectiveCamera( 75, container.offsetWidth / container.offsetHeight, 1, 10000 );

    // Set camera position
    this.camera.position.y = 6000 * this.scaleFactor;
    this.camera.position.z = 8000 * this.scaleFactor;
    //this.camera.rotation.x = -0.4;
    // Object by which the camera ratates around
    this.centerPivot.add( this.camera )
    this.scene.add( this.centerPivot );
    this.scene.add( this.group );
    this.scene.add( this.labels );
    this.scene.add( this.lights );
    this.createGrid();
    render();


    this.room = null;
    this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
    this.mainLight = new THREE.AmbientLight( 0xffffff ); // soft white light
    this.scene.add( this.mainLight );

  }


  setLightIntensity(value){
    this.mainLight.intensity = value;
  }
  /*
   * Load textures necesary to use on the pieces.
   * parameters :
   *    textures : array of texture's filenames
   */
  loadTextures(textures){
    var loader = new THREE.TextureLoader();
    loader.crossOrigin = '';
    for (var i = 0; i < textures.length; i++) {
      var texture = loader.load( textures[i].src );
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.textures[textures[i].name] = texture;
    }

  }

  setAvaliableObjects(objects){
    this.objects = objects;
  }

  removeRoom(){
    this.scene.remove(this.room.getMesh())
    this.room = null;
  }

  createRoom(w,h,l, options){
    if (this.room){
      this.removeRoom()
    }
    this.room = new Room(w,h,l, options);
    this.room.avaliableObjects = this.objects;
    this.scene.add(this.room.getMesh());
    this.addLight(w*this.scaleFactor*0.9, h*this.scaleFactor*0.9, l*this.scaleFactor*0.9);
    return this.room;
  }

  updateRoom(data){
    if(data.hasOwnProperty('dimension')){
      this.room.setSize(data.dimension);
    }
    if(data.hasOwnProperty('color')){
      this.room.setColors(data.color);
      this.room.setLight(data.light);
    }
  }

  addLight(x,y,z){
    var light = new THREE.PointLight(0xffffff, 1);
    var helper = new THREE.PointLightHelper(light, 1000 * this.scaleFactor);
    light.position.set(x, y, z);
    this.lights.add(light);
    this.lights.add(helper);

  }

  createModels(data){
    this.scene.remove(this.group);
    this.group = new THREE.Group();
    this.scene.add( this.group );
    this.data = data;
    for (var i = 0; i < data.length; i++) {
      var model = this.createModel(data[i]);
      this.group.add(model);
    }
  }

  findModelByTag(tag){
    for (var i = 0; i < this.group.children.length; i++) {
      // console.log(this.group.children[i].tag, tag, this.group.children[i].tag ==tag);
      if (this.group.children[i].tag == tag) {
        return this.group.children[i];
      }
    }
    return false;
  }


  removeModel(tag){
    var model = this.findModelByTag(tag);
    if (model){
      this.group.remove(model);
    }
  }

  addModel(data){
    // then create the model and add it to the scene
    var model = this.createModel(data);
    this.group.add(model);
  }

  createModel(data){
    var group = new THREE.Group();
    group.tag = data.tag;
    group.castShadow = true;

    // Creating meshes
    for (var i = 0; i < data.pieces.length; i++) {
      var result = this.createPiece(data.pieces[i]);
      result.piece.dataIndex     = i;
      result.piece.userData = data.pieces[i];
      result.wireframe.dataIndex = i;

      group.add(result.piece);
      group.add(result.wireframe);
    };

    group.originalMatrix = group.matrix;
    this.createModelLabel(group);
    return group;
  }

  rotate(r){
    this.centerPivot.rotation.y += r;
  }

  createPiece(data){
    var dimensions = adjustDimensions(data);
    var geometry = new THREE.BoxGeometry( dimensions.w, dimensions.h, dimensions.l );

    setTextureToGeometry(geometry, dimensions, this.textureSize);

    var pieceMesh = new THREE.Mesh(geometry, this.materials['wood'].clone());

    pieceMesh.castShadow = true;
    pieceMesh.receiveShadow = true;
    var edges = new THREE.EdgesGeometry( geometry );
    var wireframe = new THREE.LineSegments( edges, this.materials['wireframe']) ;

    if (data.texture && this.textures[data.texture.name] != undefined){
      pieceMesh.material.map = this.textures[data.texture.name];
    }
    else{
      pieceMesh.material.color.setHex(data.color);
    }

    wireframe.visible = data.wireframe;

    pieceMesh.position.x = data.x + dimensions.w/2;
    pieceMesh.position.y = data.y + dimensions.h/2;
    pieceMesh.position.z = data.z + dimensions.l/2;
    pieceMesh.scale.set(this.pieceScale,this.pieceScale,this.pieceScale);

    wireframe.position.x = data.x + dimensions.w/2;
    wireframe.position.y = data.y + dimensions.h/2;
    wireframe.position.z = data.z + dimensions.l/2;

    pieceMesh.tag = data.name;

    pieceMesh.pieceType = 'piece';
    wireframe.pieceType = 'wireframe';
    return {piece : pieceMesh, wireframe: wireframe};
  }

  updatePiece(data){
    var result = this.createPiece(data);
    var model  = this.findModelByTag(data.model);
    if (!model) return;

    for (var i = 0; i < model.children.length; i++) {
      if (model.children[i].dataIndex == data.index){
        model.remove(model.children[i]);
        model.remove(model.children[i]);
      }
    }

    result.piece.visible       = data.visible;
    result.wireframe.visible   = data.visible && data.wireframe;
    result.piece.dataIndex     = data.index;
    result.wireframe.dataIndex = data.index;

    model.add(result.piece);
    model.add(result.wireframe);
  }

  updateModel(d){
    var model;
    for (var i = 0; i < this.group.children.length; i++) {
      if (this.group.children[i].tag == d.tag)
        model = this.group.children[i]
    }
    if (model == undefined)
      return

    model.position.x = d.x;
    model.position.y = d.y;
    model.position.z = d.z;
    model.visible = d.visible;
    this.rotateModel(model, d);
    this.updateModelLabel(model);
  }



  rotateModel(group, data){
    group.matrix = group.originalMatrix;
    this.rotateAroundWorldAxis(group, new THREE.Vector3(1,0,0), data.rx * Math.PI/180);
    this.rotateAroundWorldAxis(group, new THREE.Vector3(0,1,0), data.ry * Math.PI/180);
    this.rotateAroundWorldAxis(group, new THREE.Vector3(0,0,1), data.rz * Math.PI/180);
  }

  setLineWidth(v){
  }

  setPieceScale(v){
    this.pieceScale = v;
    for (var i = 0; i < this.meshes.length; i++) {
      this.meshes[i].scale.set(this.pieceScale,this.pieceScale,this.pieceScale);
    }
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
    this.gridHelper = new THREE.GridHelper( 2000, 20 );
    this.gridHelper.visible = false;
    this.scene.add( this.gridHelper );
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
    this.gridHelper.visible=show;
  }

  // create obj file with the meshes
  exportToObj(filename, callback){
    var exporter = new THREE.OBJExporter();

		var result = exporter.parse(this.group);
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(result));
    element.setAttribute('download', filename + '.obj');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    callback();
  }

  togglePiecesVisibility(v){
    for (var i = 0; i < this.group.children.length; i++) {
      var model = this.group.children[i];
      for (var j = 0; j < model.children.length; j++) {
        if (model.children[j].pieceType == 'piece'){
          model.children[j].visible = v;
        }
      }
    }
  }

  exportGIF(filename, onProgress){
    if (location.origin == 'file://'){
      console.info("Creando GIF con metodo alternativo.");
      this.exportGIF2(filename, onProgress);
      return;
    }
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
      onProgress(steps, steps);
    });
    exporter.render();
  }

  exportGIF2(filename, onProgress){
    var that = this;
		var current = 0;
		var total = 8;
		var canvas = document.createElement( 'canvas' );
		canvas.width = that.renderer.domElement.width;
		canvas.height = that.renderer.domElement.height;
		var context = canvas.getContext( '2d' );
		var buffer = new Uint8Array( canvas.width * canvas.height * total * 5 );
		var gif = new GifWriter( buffer, canvas.width, canvas.height, { loop: 0 } );
		var pixels = new Uint8Array( canvas.width * canvas.height );
		var addFrame = function () {
      that.rotate( current == 0 ? 0 : (45 * Math.PI / 180));
			context.drawImage( that.renderer.domElement, 0, 0 );
			var data = context.getImageData( 0, 0, canvas.width, canvas.height ).data;
			var palette = [];
			for ( var j = 0, k = 0, jl = data.length; j < jl; j += 4, k ++ ) {
				var r = Math.floor( data[ j + 0 ] * 0.1 ) * 10;
				var g = Math.floor( data[ j + 1 ] * 0.1 ) * 10;
				var b = Math.floor( data[ j + 2 ] * 0.1 ) * 10;
				var color = r << 16 | g << 8 | b << 0;
				var index = palette.indexOf( color );
				if ( index === -1 ) {
					pixels[ k ] = palette.length;
					palette.push( color );
				} else {
					pixels[ k ] = index;
				}
			}
			// force palette to be power of 2
			var powof2 = 1;
			while ( powof2 < palette.length ) powof2 <<= 1;
      palette.length = powof2;
			gif.addFrame( 0, 0, canvas.width, canvas.height, pixels, { palette: new Uint32Array( palette ), delay: 100 } );
			current ++;
			if ( current < total ) {
				setTimeout( addFrame, 0 );
			} else {
				setTimeout( finish, 0 );
			}
      onProgress(total, current);
		}

		var finish = function () {
			var string = '';
			for ( var i = 0, l = gif.end(); i < l; i ++ ) {
				string += String.fromCharCode( buffer[ i ] )
			}

      var result = document.createElement('a');
      result.setAttribute('href', 'data:image/gif;base64,' + btoa( string )) ;
      result.setAttribute('download', filename + '.gif') ;
      result.style.display = 'none';
      document.body.appendChild(result);
      result.click();
      document.body.removeChild(result);
      onProgress(total, total);
		}
		addFrame();
  }

  exportIMG(filename){
    var img = this.renderer.domElement.toDataURL('image/jpeg');
    var result = document.createElement('a');
    result.setAttribute('href',  img);
    result.setAttribute('download', filename + '.jpeg') ;
    result.style.display = 'none';
    document.body.appendChild(result);
    result.click();
    document.body.removeChild(result);
    return img;
  }

  getCurrentIMG(){
    return this.renderer.domElement.toDataURL('image/jpeg');
  }

  getCurrentGIF(callback){
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
      if (callback) {
        callback(blob);
      }
    });
    exporter.render();
  }

  updateRoomElement(data){
    if (this.room){
      this.room.updateObject(data);
    }
  }

  removeRoomElement(data){
    if (this.room) {
      this.room.removeObject(data.tag);
    }
  }

  // Rotate an object around an arbitrary axis in world space
  rotateAroundWorldAxis(object, axis, radians) {
      var rotWorldMatrix = new THREE.Matrix4();
      rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
      rotWorldMatrix.multiply(object.matrix);        // pre-multiply
      object.matrix = rotWorldMatrix;
      object.rotation.setFromRotationMatrix(object.matrix)
  }

  /*
   * Search which textures must be loaded to create the pieces
   * parameters :
   *    data: pieces data
   * return
   *    toLoad: array of textures to load
   */
  extractTextures(data){
    var toLoad = []
    for (var i = 0; i < data.pieces.length; i++) {
      if (data.pieces[i].texture != undefined && toLoad.indexOf(data.pieces[i].texture) == -1){
          // should be a valid texture and must be not previously added to the lightIntensity
          toLoad.push(data.pieces[i].texture)
      }
    }
    return toLoad
  }

  /* Dibuja texto sobre los modelos para identificarlos. */
  createModelLabel(model){
    let box = new THREE.Box3().setFromObject( model );
    let center = box.getCenter();
    var position = new THREE.Vector3(
      center.x * this.scaleFactor,
      model.position.y + (box.max.y + 500) * this.scaleFactor,
      center.z * this.scaleFactor
    );
    var label = createLabel({
      text: model.tag,
      redrawInterval : 1000,
      size: 50,
      position: position,
      visible: false,
    });

    this.labels.add(label);
    model.label = label;
  }

  /* muestra / oculta los nombres sobre los modelos */
  showLabels(show){
    for (var i = 0; i < this.group.children.length; i++) {
      this.group.children[i].label.visible = show;
    }
  }

  /* actualiza el label de un modelo especifico */
  updateModelLabel(model){
    let label = model.label;
    let box = new THREE.Box3().setFromObject( model );
    let center = box.getCenter();
    let size = box.getSize();
    label.position.set(
      center.x,
      box.max.y + 500 * this.scaleFactor,
      center.z
    );
  }

  getPatternImg(model){
    var model  = this.findModelByTag(model.tag);
    var tmpLabels = new THREE.Group();
    this.scene.add(tmpLabels);

    let modelBox    = new THREE.Box3().setFromObject( model );
    let modelCenter = modelBox.getCenter();
    let modelSize   = modelBox.getSize();

    for (var i = 0; i < model.children.length; i++) {
      var piece = model.children[i];
      if (piece.pieceType == "wireframe") continue;

      let box    = new THREE.Box3().setFromObject( piece );
      let center = box.getCenter();
      let size   = box.getSize();

      let position = new THREE.Vector3(
        center.x,
        box.max.y + 4,
        box.max.z
      );

      var label = createLabel({
        text: piece.userData.pattern.frontWidth,
        size: 8,
        redrawInterval : 0,
        position: position,
        visible: true,
      });

      tmpLabels.add(label);
    }

    var aspectRatio = this.container.offsetWidth / this.container.offsetHeight;
    var height, width = 0;
    if (modelSize.z > modelSize.y){
      width  = modelSize.z * 1.2;
      height = width / aspectRatio;
    }
    else{
      height = modelSize.y * 1.2;
      width  = height * aspectRatio;
    }

    var newCamera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 10 );
    this.scene.add(newCamera);
    // this.camera = newCamera;

    newCamera.position.set(modelCenter.x, modelCenter.y, modelBox.max.z);
    newCamera.lookAt(modelCenter)

    this.renderer.render( this.scene, newCamera );

    this.exportIMG( model.tag );

    this.scene.remove(newCamera);
    this.scene.remove(tmpLabels);

  }

  showOnlyWireframe(model){
    var model  = this.findModelByTag(model.tag);
    if (!model) return;
    for (var i = 0; i < model.children.length; i++) {
      if (model.children[i].pieceType == "wireframe")
        model.children[i].visible = true;
      else
        model.children[i].visible = false;
    }
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
}

function adjustDimensions(data){
  newDimensions = {}
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

  newDimensions.w = Math.abs(position.x);
  newDimensions.h = Math.abs(position.y);
  newDimensions.l = Math.abs(position.z);
  return newDimensions;
}

/* Crea un sprite */
function createLabel(params){
  let sprite = new THREE.TextSprite({
    textSize: params.size,
    redrawInterval: params.redrawInterval,
    texture: {
      text: params.text,
      fontFamily: params.font || 'Arial, Helvetica, sans-serif',
    },
    material: {
      color: 0x000000,
    },
  });
  sprite.visible = params.visible;
  sprite.position.copy(params.position);
  return sprite;
}

function setTextureToGeometry(geometry, dimensions, textureSize){
  geometry.faceVertexUvs[0][8][0].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][8][2].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][9][2].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][8][2].x = dimensions.w / textureSize.width;
  geometry.faceVertexUvs[0][9][1].x = dimensions.w / textureSize.width;
  geometry.faceVertexUvs[0][9][2].x = dimensions.w / textureSize.width;

  geometry.faceVertexUvs[0][10][0].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][10][2].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][10][2].x = dimensions.w / textureSize.width;
  geometry.faceVertexUvs[0][11][2].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][11][1].x = dimensions.w / textureSize.width;
  geometry.faceVertexUvs[0][11][2].x = dimensions.w / textureSize.width;

  geometry.faceVertexUvs[0][4][0].y = dimensions.l / textureSize.height;
  geometry.faceVertexUvs[0][4][2].y = dimensions.l / textureSize.height;
  geometry.faceVertexUvs[0][4][2].x = dimensions.w / textureSize.width;
  geometry.faceVertexUvs[0][5][2].y = dimensions.l / textureSize.height;
  geometry.faceVertexUvs[0][5][1].x = dimensions.w / textureSize.width;
  geometry.faceVertexUvs[0][5][2].x = dimensions.w / textureSize.width;

  geometry.faceVertexUvs[0][6][0].y = dimensions.l / textureSize.height;
  geometry.faceVertexUvs[0][6][2].y = dimensions.l / textureSize.height;
  geometry.faceVertexUvs[0][6][2].x = dimensions.w / textureSize.width;
  geometry.faceVertexUvs[0][7][2].y = dimensions.l / textureSize.height;
  geometry.faceVertexUvs[0][7][1].x = dimensions.w / textureSize.width;
  geometry.faceVertexUvs[0][7][2].x = dimensions.w / textureSize.width;


  geometry.faceVertexUvs[0][0][0].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][0][2].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][0][2].x = dimensions.l / textureSize.width;
  geometry.faceVertexUvs[0][1][2].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][1][1].x = dimensions.l / textureSize.width;
  geometry.faceVertexUvs[0][1][2].x = dimensions.l / textureSize.width;

  geometry.faceVertexUvs[0][2][0].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][2][2].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][2][2].x = dimensions.l / textureSize.width;
  geometry.faceVertexUvs[0][3][2].y = dimensions.h / textureSize.height;
  geometry.faceVertexUvs[0][3][1].x = dimensions.l / textureSize.width;
  geometry.faceVertexUvs[0][3][2].x = dimensions.l / textureSize.width;
}
