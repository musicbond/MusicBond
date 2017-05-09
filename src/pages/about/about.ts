import { Component,AfterViewInit } from '@angular/core';
import { NavController,LoadingController,NavParams } from 'ionic-angular';

import { YoutubeService } from '../../services/youtube.service'
import {PlayerService} from '../../services/player.service';

import {AngularFire} from 'angularfire2';
import {  AngularFireOffline } from 'angularfire2-offline';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
  providers:[YoutubeService,PlayerService]
})
export class AboutPage implements AfterViewInit{
  vPlayer = false;
  videos = {};
  search = {
    params:''
  };  

  player;
  userId;
  pincode;
  constructor(public navCtrl: NavController,  
              public navParams:NavParams,                          
              public youtubeService: YoutubeService,
              public loadingCtrl:LoadingController,
              public af: AngularFireOffline
              ) {
      this.userId = this.navParams.data.userId;
      this.pincode = this.navParams.data.pincode;
      this.player = new PlayerService(af,this.userId,this.pincode);          
      console.log('in about ts constrcutor==',this.player == undefined);    
  }

  public ngAfterViewInit(): void {
    this.player.setupPlayer(this);    
    console.log('PLAYER::',this.player);    
  }
  
  findVideos($event){
    let loading = this.loadingCtrl.create({
    });
    loading.present();

    this.youtubeService.getVideos(this.search.params).subscribe(
      videos => {
        this.videos=videos;
        loading.dismiss();
      },
      err=>{
        console.log(err);
      }
    );
  }
  
  playVideo(id){
    this.player.launchPlayer(id)
    this.vPlayer = true;    
  }

}
