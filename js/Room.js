class Room {
  constructor(w, h, l) {
    this.scene = new THREE.Group();


    var basicMaterial = new THREE.MeshPhongMaterial( {
      color: 0xeaa04b,
      emissive: 0xeaa04b,
      side: THREE.DoubleSide,
      shading: THREE.FlatShading,
      vertexColors: THREE.FaceColors,
    })
    var geometry  = new THREE.BoxGeometry( w, h, l );
    var mesh = new THREE.Mesh(geometry, basicMaterial);
    this.scene.add(mesh)
    var light = new THREE.PointLight( 0xff0000, 1, 100 );
    light.position.set( w/2, h, l/2 );
    this.scene.add( light );
  }

  getMesh(){
    return this.scene
  }
}
