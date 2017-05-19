

class Room {
  constructor(w, h, l, domEvents) {
    this.scene = new THREE.Group();
    this.objects = [];
    this.materials = {
      'wall': new THREE.MeshPhongMaterial( {
        color: 0xaaaaaa,
        side: THREE.BackSide,
        shading: THREE.FlatShading
      }),
      'ceil': new THREE.MeshPhongMaterial( {
        color: 0x666666,
        side: THREE.BackSide,
        shading: THREE.FlatShading
      }),
      'floor': new THREE.MeshPhongMaterial( {
        color: 0x666666,
        side: THREE.BackSide,
        shading: THREE.FlatShading
      }),
      'editorBox' : new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2,
      }),
    }

    // Enable user to interact with object in the room
    this.domEvents = domEvents;


    var geometry  = new THREE.BoxGeometry( 1,1,1 );
    this.mesh = new THREE.Mesh(geometry, [
      this.materials['wall'],
      this.materials['wall'],
      this.materials['ceil'],
      this.materials['floor'],
      this.materials['wall'],
      this.materials['wall']
    ]);

    this.mesh.scale.x = w/1000
    this.mesh.scale.y = h/1000
    this.mesh.scale.z = l/1000
    this.mesh.translateX(w/1000/2);
    this.mesh.translateY(h/1000/2);
    this.mesh.translateZ(l/1000/2);



    this.scene.add(this.mesh)
    this.light = new THREE.PointLight( 0xfffbba, 1, 200, 2 );
    this.light.position.set( w/1000/2, h/1000, l/1000 );
    this.scene.add( this.light );
    this.loadTextures()
    //this.loadDoor()
    //this.loadWindow()

    // create box to show what object is currently being edited
    this.editorBox   = new THREE.BoxHelper();
    this.arrowHelper = new THREE.Group;
    this.axisHelper  = new THREE.Group;
    this.createArrowHelper();
    this.axisHelperMeshes = this.createAxisTranslationHelper();
    this.arrowHelper.visible = false;
    // this.axisHelper.visible = false;
    this.scene.add(this.editorBox);
    this.scene.add(this.arrowHelper);
    this.scene.add(this.axisHelper);
    this.selectedObject = null;
    this.onTranslation = false;

  }

  enableEditorBox(object){
    this.scene.remove(this.editorBox)
    this.editorBox = new THREE.BoxHelper(object, 0xff0000);
    this.editorBox.visible = true;
    this.scene.add(this.editorBox)
  }

  // Change the current item on the room that is being edited
  updateSelectedObject(object){
    // update position of rows and make it visible again
    this.arrowHelper.visible = true;
    this.arrowHelper.position.copy(object.position)
    this.axisHelper.position.copy(object.position)
    if (object == this.selectedObject){
      this.onTranslation = false;
      this.axisHelperMeshes['x'].visible = false
      this.axisHelperMeshes['y'].visible = false
      this.axisHelperMeshes['z'].visible = false
      return
    }
    this.enableEditorBox(object);

    this.selectedObject = object
  }


  /* public method
   * find a start the update or laod a new object
   */
  updateObject(data){
    var obj = findObjectByTag(this.objects, data.tag);
    // if is already loaded, just update
    if (obj){
      this.updateData(obj, data);
    }
    else{
      // create object
      this.loadObject(data);
    }
  }

  removeObject(tag){
    var obj = findObjectByTag(this.objects, tag);
    var index = this.objects.indexOf(obj);
    this.scene.remove(obj);
    this.objects.slice(index,1);
  }

  /* private method
   * update data from the loaded object
   */
  updateData(obj, data){
    obj.position.set(data.x/1000, data.y/1000, data.z/1000);
    obj.tag = data.tag;
  }


  loadObject(data){
    var loader = new THREE.OBJLoader( );
    var that = this;

		loader.load( 'assets/' + data.type + '.obj', function ( object ) {
      that.makeObjectSelectable(object);
      that.scene.add(object);
      that.objects.push(object);
      that.updateData(object, data);
    })
  }


  loadDoor(){
    var loader = new THREE.OBJLoader( );
    var that = this;
		loader.load( 'assets/basic_door.obj', function ( object ) {
      that.makeObjectSelectable(object);
      that.scene.add(object);
    })
  }

  loadWindow(){
    var loader = new THREE.OBJLoader( );
    var that = this;
		loader.load( 'assets/basic_window.obj', function ( object ) {
      that.scene.add(object)
      object.scale.x = object.scale.x/10
      object.scale.y = object.scale.y/10
      object.scale.z = object.scale.z/10
      that.domEvents.addEventListener(object, 'click', function(event){
        that.makeObjectSelectable(object);
      }, false)
    })
  }

  makeObjectSelectable(object){
    var that = this;
    this.domEvents.addEventListener(object, 'click', function(event){
      that.updateSelectedObject(object)
    }, false)
  }

  setSize(data){
    this.mesh.position.set(0,0,0)
    data.width   /= 1000
    data.height  /= 1000
    data.length  /= 1000
    this.mesh.scale.x = data.width ;
    this.mesh.scale.y = data.height;
    this.mesh.scale.z = data.length;
    this.mesh.position.set( data.width/2, data.height/2, data.length/2 );
  }

  setColors(data){
    this.materials['wall'].color.setHex(data.wall)
    this.materials['ceil'].color.setHex(data.ceil)
    this.materials['floor'].color.setHex(data.floor)
  }


  loadTextures(textureName){
    var wallTextureName = "beige-pattern.png"
    var ceilTextureName = "basic-white-tile.jpg"
    // load a texture, set wrap mode to repeat
    var texture = new THREE.TextureLoader().load( "assets/" + wallTextureName );
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set( 4, 4 );
    this.materials['wall'].map = texture;
    return texture
  }

  getMesh(){
    return this.scene
  }

  updateMaterials(){
    for (var i = 0; i < this.mesh.material.length; i++) {
      this.mesh.material[i]
      if (i == 2){ // 3 is the face index of the ceil
        this.mesh.material[i] = this.ceilMaterial;
      }
      else if (i == 3){ // 3 is the face index of the floor
        this.mesh.material[i] = this.floorMaterial;
      }
      else{ // others indexes are walls
        this.mesh.material[i] = this.wallMaterial;
      }
      this.mesh.material[i].map.needsUpdate = true;
    }
  }
  setLight(data){
    this.light.intensity = data.intensity;
    this.light.color.setHex(data.color);
  }

  createArrowHelper(){
    var radius = 0.05
    var height = 0.7

    var arrowGeometry = new THREE.CylinderGeometry (0, 2 * radius, height / 5)
    var xAxisMaterial = new THREE.MeshBasicMaterial ({color: 0xFF0000})
    var xAxisGeometry = new THREE.CylinderGeometry (radius, radius, height)
    var xAxisMesh     = new THREE.Mesh (xAxisGeometry, xAxisMaterial)
    var xArrowMesh    = new THREE.Mesh (arrowGeometry, xAxisMaterial)
    xAxisMesh.add (xArrowMesh)
    xArrowMesh.position.y += height / 2
    xAxisMesh.rotation.z  -= 90 * Math.PI / 180
    xAxisMesh.position.x  += height / 2
    this.arrowHelper.add( xAxisMesh )
    var that = this;
    this.domEvents.addEventListener(xAxisMesh, 'click', function(event){
      that.handleArrowHelperClick(event,true,false,false)
    }, false)

    var yAxisMaterial = new THREE.MeshBasicMaterial ({color: 0x00FF00})
    var yAxisGeometry = new THREE.CylinderGeometry (radius, radius, height)
    var yAxisMesh     = new THREE.Mesh (yAxisGeometry, yAxisMaterial)
    var yArrowMesh    = new THREE.Mesh (arrowGeometry, yAxisMaterial)
    yAxisMesh.add (yArrowMesh)
    yArrowMesh.position.y += height / 2
    yAxisMesh.position.y  += height / 2
    this.arrowHelper.add( yAxisMesh )
    this.domEvents.addEventListener(yAxisMesh, 'click', function(event){
      that.handleArrowHelperClick(event,false,true,false);
    }, false)

    var zAxisMaterial = new THREE.MeshBasicMaterial ({color: 0x0000FF})
    var zAxisGeometry = new THREE.CylinderGeometry (radius, radius, height)
    var zAxisMesh     = new THREE.Mesh (zAxisGeometry, zAxisMaterial)
    var zArrowMesh    = new THREE.Mesh (arrowGeometry, zAxisMaterial)
    zAxisMesh.add (zArrowMesh)
    zAxisMesh.rotation.x  += 90 * Math.PI / 180
    zArrowMesh.position.y += height / 2
    zAxisMesh.position.z  += height / 2
    this.arrowHelper.add( zAxisMesh)
    this.domEvents.addEventListener(zAxisMesh, 'click', function(event){
      that.handleArrowHelperClick(event,false,false,true);
    }, false)
  }

  handleArrowHelperClick(event,x,y,z){
    if (!this.selectedObject) return
    this.arrowHelper.visible = false;
    this.onTranslation = true;
    this.axisHelperMeshes['x'].visible = x
    this.axisHelperMeshes['y'].visible = y
    this.axisHelperMeshes['z'].visible = z
  }

  createAxisTranslationHelper(){
    var radius = 0.03
    var height = 50

    var xAxisMaterial = new THREE.MeshBasicMaterial ({color: 0xFF0000})
    var xAxisGeometry = new THREE.CylinderGeometry (radius, radius, height)
    var xAxisMesh     = new THREE.Mesh (xAxisGeometry, xAxisMaterial)
    xAxisMesh.visible = false;
    xAxisMesh.rotation.z  -= 90 * Math.PI / 180
    this.axisHelper.add( xAxisMesh )

    var that = this;
    this.domEvents.addEventListener(xAxisMesh, 'mousemove', function(event){
      if (that.onTranslation) {
        that.selectedObject.position.x = event.intersect.point.x
        that.editorBox.position.x = event.intersect.point.x
      }

    }, false)

    var yAxisMaterial = new THREE.MeshBasicMaterial ({color: 0x00FF00})
    var yAxisGeometry = new THREE.CylinderGeometry (radius, radius, height)
    var yAxisMesh     = new THREE.Mesh (yAxisGeometry, yAxisMaterial)
    yAxisMesh.visible = false;
    this.axisHelper.add( yAxisMesh )
    this.domEvents.addEventListener(yAxisMesh, 'mousemove', function(event){
      if (that.onTranslation) {
        that.selectedObject.position.y = event.intersect.point.y
        that.editorBox.position.y = event.intersect.point.y
      }

    }, false)

    var zAxisMaterial = new THREE.MeshBasicMaterial ({color: 0x0000FF})
    var zAxisGeometry = new THREE.CylinderGeometry (radius, radius, height)
    var zAxisMesh     = new THREE.Mesh (zAxisGeometry, zAxisMaterial)
    zAxisMesh.visible = false;
    zAxisMesh.rotation.x  += 90 * Math.PI / 180
    this.axisHelper.add( zAxisMesh)
    this.domEvents.addEventListener(zAxisMesh, 'mousemove', function(event){
      if (that.onTranslation) {
        that.selectedObject.position.z = event.intersect.point.z
        that.editorBox.position.z = event.intersect.point.z
      }
    }, false)

    this.domEvents.addEventListener(zAxisMesh, 'click', function(event){
      that.onTranslation = false
      that.axisHelperMeshes['x'].visible = false
      that.axisHelperMeshes['y'].visible = false
      that.axisHelperMeshes['z'].visible = false
    }, false)
    this.domEvents.addEventListener(xAxisMesh, 'click', function(event){
      that.onTranslation = false
      that.axisHelperMeshes['x'].visible = false
      that.axisHelperMeshes['y'].visible = false
      that.axisHelperMeshes['z'].visible = false
    }, false)
    this.domEvents.addEventListener(yAxisMesh, 'click', function(event){
      that.onTranslation = false
      that.axisHelperMeshes['x'].visible = false
      that.axisHelperMeshes['y'].visible = false
      that.axisHelperMeshes['z'].visible = false
    }, false)

    return {
      'x': xAxisMesh,
      'y': yAxisMesh,
      'z': zAxisMesh,
    }
  }
}


function findObjectByTag(list, tag){
  for (var i = 0; i < list.length; i++) {
    if (list[i].tag == tag) {
      return list[i];
    }
  }
  return false;
}

// change the scale of the data
function correctData(data){
  for (var key in data) {
    if (typeof(data[key]) == 'number') {
      data[key] /= 1000;
    }
  }
  return data;
}
