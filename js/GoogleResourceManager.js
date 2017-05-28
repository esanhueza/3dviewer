class GoogleResourceManager {
  constructor() {
      this.files = {
        // 'textures' : '13ub5jNXDlkXo0OKQi-IAr9g7XCeMVG8yd7ZZ8nsew6k',
        'textures' : '1icTft9ixHugIwCAFmdeYR0FbgOUXly2frloirHYp9ms',
      }
      this.onLoad = null;
  }

  /**
   *  Initializes the API client library and sets up sign-in state
   *  listeners.
   */
  initClient() {
    var that = this;
    gapi.client.init({
      discoveryDocs: this.discoveryDocs,
      clientId: this.clientId,
      scope: this.scopes
    }).then(function () {
      // Listen for sign-in state changes.
      //gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      // Handle the initial sign-in state.
      //updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      //authorizeButton.onclick = handleAuthClick;
      //signoutButton.onclick = handleSignoutClick;
      gapi.auth2.getAuthInstance().signIn()
      .then(function(){
          //that.onLoad();

        });
    });
  }

  /*
   * get the names, filenames and ids of the avaliable textures
   */
  getTextureList(callback){
    var that = this;
    this.downloadSpreadsheet(this.files['textures'], function(textureList){
      var requestLeft = textureList.length;
      for (var i = 0; i < textureList.length; i++) {
        if (textureList[i].archivo.length > 1 && textureList[i].nombre.length > 1){
          var textureIndex = i;
          that.getFileId(textureList[i].archivo, function(id, index){
            textureList[index].id = id;
            requestLeft-=1;
            if (requestLeft == 0){
              callback(textureList);
            }
          }, i);
        }
        else{
          textureList.splice(i,1);
          i--;
          requestLeft-=1;
        }
      }

    })
  }

  getTextureList(callback){
    var that = this;
    $.get({
      // url: "https://docs.google.com/spreadsheets/d/13ub5jNXDlkXo0OKQi-IAr9g7XCeMVG8yd7ZZ8nsew6k/pub?output=csv",
      url: "https://spreadsheets.google.com/feeds/list/" + that.files['textures'] + "/od6/public/full?alt=json",
      success: function(response) {
        var len = response.feed.entry.length;
        var data = response.feed.entry;
        var output = [];
        for (var i = 1; i < len; i++) {
          var name = data[i].gsx$material.$t;
          var link = data[i].gsx$link.$t;
          if (link.length > 0){
            output.push({
              'name': name,
              'src': link
            })
          }
        }
        if (callback){
          callback(output);
        }
      },
      error: function(response){
        console.log("error loading texture info");
        console.log(response);
      }
    });
  }

  getFileId(filename, callback, param){
    var request = gapi.client.drive.files.list({
      q: "name='"+filename+"'",
      fields: 'files(id, name)'
    });
    request.then(function(resp) {
      callback(resp.result.files[0].id, param);
    });
  }

  /* dowload a image from google drive folder */
  downloadImg(id, callback, index){
    var request = gapi.client.drive.files.get({
      'fileId': id,
      'alt':'media',
    });
    request.then(function(resp) {

      callback('data:image/jpg;base64,'+btoa(resp.body), index);
    });
  }

  /* download multiple images from google drive folder using batched requests
   * params: ids : array of iamge's id
   */
  downloadImgs(imgs, callback, onFinish){
    var batch = gapi.client.newBatch();
    var that = this;
    var index = 0;
    var downloadInterval = setInterval(function(){
      if (index >= imgs.length){
        clearInterval(downloadInterval);
        return;
      }
      that.downloadImg(imgs[index].id, callback, index);
      index += 1;
    }, 400);
  }

  /* dowload a google doc from google drive folder, return data as json */
  downloadSpreadsheet(id, callback){
    var request = gapi.client.drive.files.export({
      'fileId': id,
      'mimeType': 'text/csv'

    });
    request.then(function(resp) {
      if (callback){
        callback(csvToJson(resp.body, ['nombre', 'archivo']));
      }
    });
  }
}

//var csv is the CSV file with headers
  function csvToJson(csv, header){
    csv = csv.replace('\r', '');
    var lines=csv.split("\n");
    var result = [];
    var headers = header;
    for(var i=1;i<lines.length;i++){
      var obj = {};
      var currentline=lines[i].replace('\r', '').split(",");
      for(var j=0;j<headers.length;j++){
        obj[headers[j]] = currentline[j];
      }
      result.push(obj);
    }
    return result; //JavaScript object
    //return JSON.stringify(result); //JSON
  }
