import { Component } from '@angular/core';
import { NavController,NavParams } from 'ionic-angular';
import { ToastController,ModalController } from 'ionic-angular';

import { FileChooser } from '@ionic-native/file-chooser';

import {ImageModel} from '../others/imageModel/imageModel'

import {AngularFire} from 'angularfire2';
import * as firebase from 'firebase';
import {  AngularFireOffline,AfoListObservable } from 'angularfire2-offline';

declare var window: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  userId;
  pincode;
  chats;
  userInput="";
  isUploading=false;
  uploadProgress=0;
  msgType={
    TEXT:0,
    IMAGE:1
  }
  //isPlaying=false;
  commonProps;
  fileTransfer;  

  constructor(public navCtrl: NavController,
              public navParams:NavParams,
              private fileChooser: FileChooser,
              public af: AngularFireOffline,
              public toastCtrl:ToastController,
              public modalCtrl:ModalController) {
    this.commonProps = this.navParams.data.commonProps;
    this.userId = this.navParams.data.userId;
    this.pincode = this.navParams.data.pincode;
    console.log("HOME params:",this.navParams);

    //this.commonProps.isPlaying = this.isPlaying;
    this.commonProps.playingSong = 'CHAT';
    /*let promise = af.database.object('/chats').remove();
    promise
    .then(_ => this.updateChatVariable(af))
    .catch(err => this.updateChatVariable(af)); */       
    this.updateChatVariable(af);
  }

  updateChatVariable(af){
    //this.userId=Math.ceil(Math.random()*1000);
    this.chats = af.database.list('/chats/'+this.pincode);
    //this.presentToast('Now you can Start Chat');
  }

  togglePlaying(){
    /*if(this.isPlaying){
      this.isPlaying = false;
    }
    else{
      this.isPlaying = true;
    }
    if( this.commonProps != undefined && 
        this.commonProps.player != undefined && 
        //this.commonProps.player.nativeElement != undefined &&
        this.commonProps.player.paused != undefined && 
        this.commonProps.player.duration > 0){
        if(this.isPlaying && this.commonProps.player.paused){
          this.commonProps.player.play();
        }else if(!this.isPlaying && !this.commonProps.player.paused){
          this.commonProps.player.pause();
        }
    }*/
    if( this.commonProps != undefined && 
        this.commonProps.player != undefined && 
        this.commonProps.player.paused != undefined && 
        this.commonProps.player.duration > 0){
      if(this.commonProps.isPlaying){
        this.commonProps.player.pause();
      }else{
        this.commonProps.player.play();
      }
    }
  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 3000,
      position:'top'
    });
    toast.present();
  }

  sendMessage(inputTag){
    if(this.userInput.length == 0)
      return;
    this.chats.push({
      message: this.userInput,
      id:this.userId,
      type:this.msgType.TEXT,
      timestamp:new Date().getTime()
    });
    this.userInput="";
    console.log("messages:",this.chats);
    let tmp = document.getElementById('chatListDiv');
    tmp.scrollTop = tmp.scrollHeight;
    //inputTag.setFocus();
  }

  getChatTime(time){
    let given=new Date(time);
    let now=new Date();
    if(given.toString().substr(4,11) == now.toString().substr(4,11)){
      return given.toString().substr(16,5);
    }
    return given.getDate()+':'+given.getMonth()+':'+(given.getFullYear().toString().substr(2));
  }

  //-------------------------------UPLOAD IMAGE TO FIREBASE--------------------------------------//
  ChooseLocalImageFile(){
    console.log('helllo clicker');
    this.fileChooser.open()
      .then(uri => this.uploadFiletoFireBase(uri))
      .catch(e => console.log('chose file Error',e));
  }

  uploadFiletoFireBase(uri){
    this.makeFileIntoBlob(uri).then((_imageBlob) => {
      console.log('got image file ' , _imageBlob);
      // upload the blob
      return this.uploadToFirebase(_imageBlob);

    }).then((_uploadSnapshot: any) => {
      console.log('file uploaded successfully  ' + _uploadSnapshot.downloadURL);
      this.isUploading=false;
      this.uploadProgress=0;
      return this.saveToDatabaseImagesList(_uploadSnapshot);
    }).then((_uploadSnapshot: any) => {
    console.log('file saved to asset catalog successfully  ');
      this.isUploading=false;
      this.uploadProgress=0;
    });
  }

  makeFileIntoBlob(_imagePath) {

    // INSTALL PLUGIN - cordova plugin add cordova-plugin-file
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(_imagePath, (fileEntry) => {

        fileEntry.file((resFile) => {

          var reader = new FileReader();
          reader.onloadend = (evt: any) => {
            var imgBlob: any = new Blob([evt.target.result]);
            imgBlob.name = _imagePath.split('/').pop();
            console.log('Image path:',_imagePath);
            resolve(imgBlob);
          };

          reader.onerror = (e) => {
            console.log('Failed file read: ' + e.toString());
            reject(e);
          };

          reader.readAsArrayBuffer(resFile);
        });
      });
    });
  }

  uploadToFirebase(_imageBlob) {
    console.log('final image blob ' , _imageBlob);
      
    var fileName = 'sample-' + new Date().getTime() + '_'+_imageBlob.name;

    return new Promise((resolve, reject) => {
      var fileRef = firebase.storage().ref('images/'+this.pincode+'/' + fileName);

      var uploadTask = fileRef.put(_imageBlob);
      this.isUploading=true;
      this.uploadProgress=0;

      uploadTask.on('state_changed', (_snapshot) => {
        console.log('snapshot progess ' , _snapshot);
        this.uploadProgress=_snapshot.b/_snapshot.i * 100;
      }, (_error) => {
        reject(_error);
      }, () => {
        // completion...
        resolve(uploadTask.snapshot);
      });
    });
  }

  saveToDatabaseImagesList(_uploadSnapshot) {
    console.log('image in firebase obj',_uploadSnapshot);
    var ref = firebase.database().ref('/chats/'+this.pincode);

    return new Promise((resolve, reject) => {

      /* we will save meta data of image in database
      var dataToSave = {
        'URL': _uploadSnapshot.downloadURL, // url to access file
        'name': _uploadSnapshot.metadata.name, // name of the file
        'lastUpdated': new Date().getTime(),
      };*/

      this.chats.push({
        url: _uploadSnapshot.downloadURL,
        id:this.userId,
        type:this.msgType.IMAGE,
        timestamp:new Date().getTime()
      }, (_response) => {
        resolve(_response);
      }).catch((_error) => {
        reject(_error);
      });

      
    });

  }

  showImageInFullScreen(url){
    let model=this.modalCtrl.create(ImageModel, {imgUrl:url});
    model.present();
  }  
 
}

