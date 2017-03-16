
Aplicación creada con la libreria de renderizado 3D para navegadores Threejs

Existen dos archivos que controlan la logica de la aplicación
app.js: Recibe los eventos que se realizan en el navegador y controla al editor para realizar las acciones de acuerdo a los eventos. Tambien obtiene la información desde el link que se entrega.
Viewer.js Es la clase que controla el renderizado 3D, actua como capa intermedia entre app.js y Three.js.
