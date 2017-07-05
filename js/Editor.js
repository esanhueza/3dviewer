class Editor{
  constructor(options) {
    this.modelsTable = $(options.modelsTable);
    this.piecesTable = $(options.piecesTable);
    this.pieceEditor = {}; // cada uno de los inputs que conforman el editor de piezas
    this.modelEditor = {}; // cada uno de los inputs que conforman el editor de piezas
    this.initPieceEditor(options.pieceEditor);
    this.initModelEditor(options.modelEditor);
    this.models = {};
    this.viewer = options.viewer;
    this.selectedModel = null;
    this.selectedPiece = null;
    this.loadedTextures = null;
  }


  initPieceEditor(items){
    for (var item in items) {
      if (items.hasOwnProperty(item)) {
        this.pieceEditor[item] = $(items[item]);
      }
    }
  }
  initModelEditor(items){
    for (var item in items) {
      if (items.hasOwnProperty(item)) {
        this.modelEditor[item] = $(items[item]);
      }
    }
  }

  // agrega un nuevo modelo a la tabla de modelos.
  appendModel(model){
    // TODO: Check model
    if (!this.models[model.tag])
      this.modelsTable.bootstrapTable('append', model);
    else
      this.modelsTable.bootstrapTable('updateByUniqueId', model.guid, model);
    this.models[model.tag] = model;
  }

  // eliminar un modelo a la tabla de modelos.
  removeModel(model){
    delete this.models[model.tag];
    this.modelsTable.bootstrapTable('removeByUniqueId', model.guid);
  }

  // actualiza las piezas del modelo que se muestra en la tabla de piezas.
  updatePiecesTable(){
    if (this.selectedModel){
        this.piecesTable.bootstrapTable('load', this.selectedModel.pieces);
    }
  }

  // cambia el modelo actualmente seccionado
  selectModel(model){
    this.selectedModel = model;
    this.updateModelEditor();
    this.updatePiecesTable();
  }

  // cambia la pieza actualmente seccionada
  selectPiece(piece){
    this.selectedPiece = piece;
    this.updatePieceEditor();
  }

  // cambia el modelo actualmente seccionado
  updateModel(model){
    this.modelsTable.bootstrapTable('updateByUniqueId', model.guid, model);
    this.viewer.updateModel(model);
    this.updatePiecesTable();
  }

  // quita los datos de la pieza que se muestra en el editor
  cleanPieceEditor(){
    this.pieceEditor.editor[0].reset();
    this.pieceEditor.index.html('');
    this.pieceEditor.model.html('');
  }

  updateModelEditor(){
    this.modelEditor.editor.find('input, select').off('change');
    var m = this.selectedModel;
    this.modelEditor.index.html(m.index);
    this.modelEditor.model.html(m.tag);
    this.modelEditor.rx.val(m.rx);
    this.modelEditor.ry.val(m.ry);
    this.modelEditor.rz.val(m.rz);
    this.modelEditor.x.val(m.x);
    this.modelEditor.y.val(m.y);
    this.modelEditor.z.val(m.z);
    this.modelEditor.visible.bootstrapToggle(m.visible?'on':'off');
    this.modelEditor.editor.find('input, select').on('change', $.proxy(this.updateModelByEditor, this));
  }

  updatePieceEditor(){
    this.pieceEditor.editor.find('input, select').off('change');
    var p = this.selectedPiece;
    this.pieceEditor.name.html(p.name);
    this.pieceEditor.model.html(p.model);
    this.pieceEditor.width.val(p.w);
    this.pieceEditor.height.val(p.h);
    this.pieceEditor.length.val(p.l);
    this.pieceEditor.x.val(p.x);
    this.pieceEditor.y.val(p.y);
    this.pieceEditor.z.val(p.z);
    this.pieceEditor.visible.bootstrapToggle(p.visible?'on':'off');
    this.pieceEditor.wireframe.bootstrapToggle(p.wireframe?'on':'off');
    this.pieceEditor.color.val(p.color.replace('0x', '#'));
    this.pieceEditor.orientation.find('option[value="'+p.orientation+'"]').prop('selected', 'selected');
    this.pieceEditor.texture.find('option[data-index="'+(p.texture ? p.texture.index : '-1')+'"]').prop('selected', 'selected');
    this.pieceEditor.editor.find('input, select').on('change', $.proxy(this.updatePieceByEditor, this));
  }

  // actualiza la información de una pieza en la tabla y el visor.
  updatePiece(piece){
    this.models[piece.model].pieces[piece.index] = piece;
    this.viewer.updatePiece(piece);
    this.piecesTable.bootstrapTable('updateByUniqueId', piece.index, piece);
    this.updatePieceEditor();
  }

  // actualiza la información de una pieza en la tabla y el visor segun los datos del editor de piezas.
  updatePieceByEditor(){
    var p = this.selectedPiece;
    p.w = parseInt(this.pieceEditor.width.val());
    p.h = parseInt(this.pieceEditor.height.val());
    p.l = parseInt(this.pieceEditor.length.val());
    p.x = parseInt(this.pieceEditor.x.val());
    p.y = parseInt(this.pieceEditor.y.val());
    p.z = parseInt(this.pieceEditor.z.val());
    p.visible     = this.pieceEditor.visible.is(':checked');
    p.wireframe   = this.pieceEditor.wireframe.is(':checked');
    p.color       = this.pieceEditor.color.val();
    p.orientation = this.pieceEditor.orientation.val();
    p.texture     = this.loadedTextures[this.pieceEditor.texture.find(':selected').attr('data-index')];

    this.models[p.model].pieces[p.index] = p;
    this.viewer.updatePiece(p);
    this.piecesTable.bootstrapTable('updateByUniqueId', p.index, p);
  }

  updateModelByEditor(){
    var m = this.selectedModel;
    m.rx = parseInt(this.modelEditor.rx.val());
    m.ry = parseInt(this.modelEditor.ry.val());
    m.rz = parseInt(this.modelEditor.rz.val());
    m.x  = parseInt(this.modelEditor.x.val());
    m.y  = parseInt(this.modelEditor.y.val());
    m.z  = parseInt(this.modelEditor.z.val());
    m.visible = this.modelEditor.visible.is(':checked');
    this.models[m.tag] = m;
    this.modelsTable.bootstrapTable('updateByUniqueId', m.guid, m);
    this.viewer.updateModel(m);
  }

  // // Cambia las piezas que son mostradas en la tabla de piezas.
  // setModelOnPieceEditor(model){
  //   // si el modelo es el mismo que ya esta en la tabla, se omite.
  //   if (this.pieceEditor.model != model){
  //     this.pieceEditor.clean();
  //     this.pieceEditor.model = model;
  //   }
  // }
}
