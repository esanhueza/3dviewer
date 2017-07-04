class GoogleResourceManager {
  constructor() {
      this.clientId = "498953387759-q8ehh29573e69rj3hbv99ofuma3ue6mn.apps.googleusercontent.com";
      this.scopes = 'https://www.googleapis.com/auth/drive';
      this.discoveryDocs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
      this.files = {
        'textures' : '13ub5jNXDlkXo0OKQi-IAr9g7XCeMVG8yd7ZZ8nsew6k',
        // 'textures' : '1icTft9ixHugIwCAFmdeYR0FbgOUXly2frloirHYp9ms',
      }
      this.initialized = false;
      this.onLoad = null;
      this.authorizeButton = $('#authorize-button');
      this.signoutButton = $('#signout-button');
      this.dropdownItems = $('.dropdown-google-item');
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
      // Handle the initial sign-in state.
      that.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      that.authorizeButton.on('click', function(evt){
        that.handleAuthClick(evt);
      });
      that.signoutButton.on('click', function(evt){
        that.handleSignoutClick(evt);
      });
    });
  }

  /**
   *  Called when the signed in status changes, to update the UI
   *  appropriately. After a sign-in, the API is called.
   */
  updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      this.authorizeButton.hide();
      this.signoutButton.show();
      this.dropdownItems.show();
    } else {
      this.authorizeButton.show();
      this.signoutButton.hide();
      this.dropdownItems.hide();
    }
  }

  /**
   *  Sign in the user upon button click.
   */
  handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
    this.updateSigninStatus(true);
  }

  /**
   *  Sign out the user upon button click.
   */
  handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
    this.updateSigninStatus(false);
  }

  uploadImg(filename, contentType, file){
    file = file.replace(/^data:.*;base64,/, "")
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    var metadata = {
      'title': filename,
      'mimeType': contentType
    };

    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        file +
        close_delim;


    var request = gapi.client.request({
      'path': '/upload/drive/v2/files',
      'method': 'POST',
      'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
       'body': multipartRequestBody});

    request.then(function(resp){
      console.log(resp);
    });
  }

  uploadObj(filename, file){
    file = file.replace(/^data:.*;base64,/, "")
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    var metadata = {
      'title': filename + '.obj',
      'mimeType': 'text/plain'
    };

    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + 'text/plain' + '\r\n' +
        '\r\n' +
        file +
        close_delim;


    var request = gapi.client.request({
      'path': '/upload/drive/v2/files',
      'method': 'POST',
      'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
       'body': multipartRequestBody});

    request.then(function(resp){
      console.log(resp);
    });
  }



  /*
   * get the names, filenames and ids of the avaliable textures
   */
  // getTextureList(callback){
  //   var that = this;
  //   this.downloadSpreadsheet(this.files['textures'], function(textureList){
  //     var requestLeft = textureList.length;
  //     for (var i = 0; i < textureList.length; i++) {
  //       if (textureList[i].archivo.length > 1 && textureList[i].nombre.length > 1){
  //         var textureIndex = i;
  //         that.getFileId(textureList[i].archivo, function(id, index){
  //           textureList[index].id = id;
  //           requestLeft-=1;
  //           if (requestLeft == 0){
  //             callback(textureList);
  //           }
  //         }, i);
  //       }
  //       else{
  //         textureList.splice(i,1);
  //         i--;
  //         requestLeft-=1;
  //       }
  //     }
  //
  //   })
  // }

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
              'src': link,
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
function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

  var blob = new Blob(byteArrays, {type: contentType});
  return blob;
}
