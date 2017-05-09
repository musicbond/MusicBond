import { Component,AfterViewInit } from '@angular/core';
import { NavController,NavParams } from 'ionic-angular';

import { FileChooser } from '@ionic-native/file-chooser';
import {AngularFire,FirebaseListObservable} from 'angularfire2';
import {  AngularFireOffline } from 'angularfire2-offline';

import * as firebase from 'firebase';

import * as jsmediatags from 'jsmediatags';

declare var window: any;

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage implements AfterViewInit {
  userId;
  pincode;
  songs;
  playerSrc;
  isUploading=false;
  uploadProgress=0;
  playingSongIndex=-1;
  commonProps;
  constructor(public navCtrl: NavController,
              public navParams:NavParams,
              private fileChooser: FileChooser,
              public af: AngularFireOffline
              ) {
      this.commonProps = this.navParams.get('commonProps');
      this.userId=this.navParams.data.userId;
      this.pincode=this.navParams.data.pincode;
      this.songs = af.database.list('/songs/'+this.pincode);
      console.log('songs databse obj',this.songs);
  }
  audioPlayer;
  
  //``````````````````````````````````````````````````````````````````````
  
  PLAYING = 0;
  PAUSED = 1;
  SEEK_AUDIO = 2;
  START_AUDIO = 4;
  
  //userId;
  AFnewAudio;
  AFaudioChanges;
  playedByOthers=false;
  pausedByOthers=false;
  seekedByOthers=false;
  ngAfterViewInit(){
    //this.userId = Math.floor(Math.random()*10000); 
    this.audioPlayer = document.getElementById('player'); 
    this.commonProps.player = this.audioPlayer;
    console.log('audio player',this.audioPlayer);
    console.log('songs:',this.songs);
    this.audioPlayer.addEventListener("seeked", (e) => { 
        console.log('seeked',e);
        if(!this.seekedByOthers)
          this.AFaudioChanges.set({'id':this.userId ,'state':this.SEEK_AUDIO,'songTime':e.target.currentTime,'time': this.getUTCTime()});
        this.seekedByOthers=false;
    });
     this.audioPlayer.addEventListener("play", (e) => { 
        console.log('play',e);
        if(!this.playedByOthers)
          this.AFaudioChanges.set({'id':this.userId ,'state':this.PLAYING,'songTime':e.target.currentTime,'time': this.getUTCTime()});
        this.playedByOthers=false;
        this.commonProps.isPlaying = true;
    });
     this.audioPlayer.addEventListener("pause", (e) => { 
        console.log('pause',e);
        if(!this.pausedByOthers)
          this.AFaudioChanges.set({'id':this.userId ,'state':this.PAUSED,'songTime':e.target.currentTime,'time': this.getUTCTime()});
        this.pausedByOthers=false;
        this.commonProps.isPlaying = false;
    });

    let promise = this.af.database.object('/audioChanges/'+this.pincode).remove();
    promise
    .then(_ => this.updateAudioChangesVariable())
    .catch(err => this.updateAudioChangesVariable());
    
    promise = this.af.database.object('/newAudio/'+this.pincode).remove();
    promise
    .then(_ => this.updateAFnewAudio())
    .catch(err => this.updateAFnewAudio());    

  }

  updateAudioChangesVariable(){
    this.AFaudioChanges = this.af.database.object('/audioChanges/'+this.pincode);    
    this.AFaudioChanges.subscribe(snapshot => {
        console.log('subscribe video cng result:'+this.userId);        
        console.log(snapshot);                
        if(snapshot.id == null || snapshot.id == this.userId)
            return;
        this.makeVideoChanges(snapshot);
    });
  }
    makeVideoChanges(given){
      switch(given.state){
        case this.PLAYING:
                    this.playedByOthers = true;
                    this.audioPlayer.play();                    
                    break;
        case this.PAUSED:
                    this.pausedByOthers=true;
                    this.audioPlayer.pause();        
                    break
        case this.SEEK_AUDIO://seekto
                    this.seekedByOthers=true;
                    this.audioPlayer.currentTime=(given.songTime);
                    break;
        default:
            break;
      }
  }
  updateAFnewAudio(){
    this.AFnewAudio = this.af.database.object('/newAudio/'+this.pincode);      
    this.AFnewAudio.subscribe(snapshot => {
        console.log('subscribe new video result:'+this.userId);        
        console.log(snapshot);                
        if(snapshot.id == null || snapshot.id == this.userId)
            return;
        
        this.playSong({'URL':snapshot.URL,'title':snapshot.title == undefined ? "no title": snapshot.title}, snapshot.index);
    
    });
  }

  getUTCTime(){
      let tmp = ( new Date(Date.now()-(new Date().getTimezoneOffset()*60000)).getTime() );
      return tmp;
  }

  //````````````````````````````````````````````````````````````````````
  filterList(event){
    //event.target.value
    console.log('SEARCH EVENTS:',event);
  }
  addSongToPlayList(event){
    console.log('Add to PlayList',event);
  }

  ChooseLocalFile(){
    this.fileChooser.open()
      .then(uri => this.uploadFiletoFireBase(uri))
      .catch(e => console.log('chose file Error',e));
  }

  getSongInfo(uri,uploadSongSnapshot){
     return new Promise((resolve, reject) => {
        this.makeFileIntoBlob(uri).then((_imageBlob) => {
            let thisObj=this;
            jsmediatags.read(_imageBlob, {
                onSuccess: function(tag) {
                  console.log('sucess jsmedia tag',tag);
                  tag.tags.song = uploadSongSnapshot.downloadURL;
                  if(tag.tags.picture){
                    let blob = new Blob([new Uint8Array(tag.tags.picture.data)], { type: tag.tags.picture.format });
                    thisObj.uploadSongImageToFirebase(blob).then((_uploadImgSnapshot: any) => {
                          console.log('image file uploaded successfully  ' + _uploadImgSnapshot.downloadURL);
                          tag.tags.picture = _uploadImgSnapshot.downloadURL;                          
                          resolve(tag.tags)
                    });
                  }else{
                    if(tag.tags.title == undefined)
                      tag.tags.title = uploadSongSnapshot.metadata.name;
                    tag.tags.picture = 'assets/unknownSong.png';
                    resolve(tag.tags);
                  }
                },
                onError: function(error) {
                  console.log(':(', error.type, error.info);
                  //reject(error);
                  resolve({song:uploadSongSnapshot.downloadURL,title:uploadSongSnapshot.metadata.name,picture:'assets/unknownSong.png'});
                }
            });
        });
      });
    }

  playSongByMe(song,i){
    this.AFnewAudio.set({'id':this.userId ,'state':this.START_AUDIO,'index':i,'URL':song.URL,'title':song.title,'time': this.getUTCTime()});    
    this.playSong(song,i);
  }

  playSong(song,i){
    this.commonProps.playingSong = song.title;
    this.playingSongIndex = i;   
    console.log("SELCED SONG:",song);
    this.updateSource(song.URL);
  }

  updateSource(url) { 
        console.log("URL:",url);
        /*let source = document.getElementById('mp3Source');
        source.src=url;*/
        this.playerSrc=url;
        this.audioPlayer.load(); //call this to just preload the audio without playing
        this.audioPlayer.play(); //call this to play the song right away
    }

  uploadFiletoFireBase(uri){
    this.makeFileIntoBlob(uri).then((_imageBlob) => {
      console.log('got song file ' , _imageBlob);
      return this.uploadToFirebase(_imageBlob);
    }).then((_uploadSnapshot: any) => {
      console.log('file uploaded successfully  ' + _uploadSnapshot.downloadURL);
      return this.getSongInfo(uri,_uploadSnapshot);
    }).then((_uploadSnapshot: any)=>{
      return this.saveToDatabaseSongsList(_uploadSnapshot);
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
      var fileRef = firebase.storage().ref('songs/'+this.pincode+'/' + fileName);

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

  uploadSongImageToFirebase(_imageBlob) {
    console.log('final image blob ' , _imageBlob);
      
    var fileName = 'sample-' + new Date().getTime() + '_.jpg';

    return new Promise((resolve, reject) => {
      var fileRef = firebase.storage().ref('songs/images/'+this.pincode+'/' + fileName);

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

  saveToDatabaseSongsList(_uploadSnapshot) {
    var ref = firebase.database().ref('/songs/'+this.pincode);
    return new Promise((resolve, reject) => {
      /*
      // we will save meta data of image in database
      var dataToSave = {
        'URL': _uploadSnapshot.downloadURL, // url to access file
        'name': _uploadSnapshot.metadata.name, // name of the file
        'lastUpdated': new Date().getTime(),
      };
      */
      let dataToSave:any = {};
      dataToSave.URL=_uploadSnapshot.song;
      dataToSave.title=_uploadSnapshot.title;
      if(_uploadSnapshot.artist)
        dataToSave.artist=_uploadSnapshot.artist;
      if(_uploadSnapshot.picture)
        dataToSave.cover=_uploadSnapshot.picture;
      if(_uploadSnapshot.album)
        dataToSave.album=_uploadSnapshot.album;
      
      ref.push(dataToSave, (_response) => {
        resolve(_response);
      }).catch((_error) => {
        reject(_error);
      });
    });

  }

  
  /*uploadFiletoFireBase(uri){
    //let f = new File(uri);
    console.log("file chosed:",uri);
    console.log("af:",this.af);
    console.log('firebase',firebase);

    let filePath=uri.slice(0,uri.lastIndexOf('/'));
    let fileName=uri.split('/').pop();
    
    let storageRef = firebase.storage().ref();
    let data=this.getData(filePath,fileName);
    console.log('data::',data);
    let uploadTask = storageRef.child('images/' + fileName).put(data);
    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
      function(snapshot) {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log('Upload is paused');
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log('Upload is running');
            break;
        }
      }, function(error) {
      
      });  
  }

  

  getData(filePath,fileName) {
    return this.file.readAsArrayBuffer(filePath,fileName);
    //file
  }*/

}
