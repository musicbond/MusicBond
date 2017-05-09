import { Component } from '@angular/core';

import {  Platform, NavParams, ViewController } from 'ionic-angular';
import { Transfer, TransferObject } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';
//import { FilePath } from '@ionic-native/file-path';

import { LoadingController } from 'ionic-angular';

@Component({
  selector: 'page-image-model',
  templateUrl: 'imageModel.html'
})
export class ImageModel {
  imgSrc;
  fileTransfer;
  loader;
  constructor(
              public platform: Platform,
              public params: NavParams,
              public viewCtrl: ViewController,
              private transfer: Transfer,
              private file: File,
              //private filePath:FilePath,
              private loadingCtrl:LoadingController) {   
      this.fileTransfer =  this.transfer.create();    
      this.dowloadFileToLocalStorage(this.params.get('imgUrl'));    
      this.presentLoading();
  }   
  presentLoading() {
    this.loader = this.loadingCtrl.create({
      content: "Please wait...",
      dismissOnPageChange: true
    });
    this.loader.present();
  }
  dismissLoading(){
    if(this.loader){
        this.loader.dismissAll();
    }
  }

  dowloadFileToLocalStorage(url){
    this.presentLoading();
    this.fileTransfer.download(url, 
        this.file.dataDirectory +this.getFilenameFromURL(url)
        ).then(
          (entry) => {
            console.log('img download complete: ' + entry.toURL(), entry);      
            this.dismissLoading();
            
            /*this.filePath.resolveNativePath(entry.toURL())
                .then(filePath => {
                  console.log('fiele path::',filePath);
                  this.imgSrc=filePath;
                })
                .catch(err => console.log(err));
            */
            this.imgSrc = entry.toURL();

          }, (error) => {
            this.dismissLoading();
            console.log('img download err: ', error);
          }
        );
  }
  getFilenameFromURL(url){
    if (url)
    {
        return url.split('/').pop().split('#')[0].split('?')[0];
    }
    return "unknown.jpg";
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
  
}