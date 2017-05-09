import { Injectable  } from '@angular/core';
//import { window } from '@angular/platform-browser/src/facade/browser';

import {AngularFire, FirebaseObjectObservable} from 'angularfire2';
import {  AngularFireOffline } from 'angularfire2-offline';

declare var YT: any;

@Injectable()
export class PlayerService {
  youtube: any = {
    ready: false,
    player: null,
    playerId: null,
    videoId: null,
    videoTitle: null,
    playerHeight: '360',
    playerWidth: '640'
  };
  AFvideoChanges;
  AFnewVideo;
  AFnewVideoSync;
  onPlaying:boolean = false;
  seekVal = 0;
  videoLength=0;
  angularFire;
  START_VIDEO=6;
  SEEK_VIDEO=7;
  SYNC_CHECK=8;
  vPlayer=false;
  //zone;
  constructor(public af:AngularFireOffline,
              public userId:string,
              public pincode:number) {
    //this.zone=new NgZone({enableLongStackTrace: false});
    console.log('inside PlayerService:');
    console.log('af::',af);
    console.log('userid::',userId);
    console.log('pincode:',pincode)
    this.angularFire=af;
    let promise = af.database.object('/videoChanges/'+this.pincode).remove();
    promise
    .then(_ => this.updateVideoChangesVariable())
    .catch(err => this.updateVideoChangesVariable());
    
    promise = af.database.object('/newVideo/'+this.pincode).remove();
    promise
    .then(_ => this.updateAFnewVideo())
    .catch(err => this.updateAFnewVideo());    

    promise = af.database.object('/newVideoSync/'+this.pincode).remove();
    promise
    .then(_ => this.updateAFnewVideoSync())
    .catch(err => this.updateAFnewVideoSync());    
  }

  updateVideoChangesVariable(){
    //this.userId = Math.floor(Math.random()*1000);
    console.log(this.AFvideoChanges)
    console.log(this.angularFire)
    
    this.AFvideoChanges = this.angularFire.database.object('/videoChanges/'+this.pincode);    

    console.log('setting video change angular:',this.AFvideoChanges)
    this.AFvideoChanges.subscribe(snapshot => {
        console.log('subscribe video cng result:'+this.userId);        
        console.log(snapshot);                
        if(snapshot.id == null || snapshot.id == this.userId || this.vPlayer == false)
            return;
        this.makeVideoChanges(snapshot);
    });
    
  }

  forEverFunction(){
    setInterval(() => {
          if(this.youtube.player && this.onPlaying == true){// && this.youtube.player.getCurrentTime()%10 == 0){
            this.seekVal =  this.youtube.player.getCurrentTime();
            console.log('sending async:',this.seekVal);
            this.AFnewVideoSync.set({'id':this.userId ,
                                 'state':this.SYNC_CHECK,
                                 'video_id': this.youtube.videoId,
                                 'cur_video_t':this.seekVal,
                                 'cur_play_t': this.getUTCTime()});
          }          
        }, 10000);
  }

  updateAFnewVideoSync(){
    this.AFnewVideoSync = this.angularFire.database.object('/newVideoSync/'+this.pincode);      
    this.AFnewVideoSync.subscribe(snapshot => {
        //console.log('subscribe new video SYNC res:'+this.userId);        
        if(snapshot.id == null || snapshot.id == this.userId)
            return;
        
        let tmp = this.getUTCTime();
        let timeDiff= tmp/1000 - snapshot.cur_play_t/1000;
        let givenVideoTime = snapshot.cur_video_t + timeDiff+0.09;
        //console.log(snapshot.cur_video_t,this.youtube.player.getCurrentTime(),givenVideoTime);
        //console.log('diff:'+(this.youtube.player.getCurrentTime()-givenVideoTime));
        if(this.youtube.player.getCurrentTime() < givenVideoTime){
          this.youtube.player.seekTo(givenVideoTime);
        }        
        /*if(this.youtube.player.getCurrentTime() < snapshot.cur_video_t){
          this.youtube.player.seekTo(snapshot.cur_video_t);
        }*/
    });
    //this.forEverFunction();             
  }

  updateAFnewVideo(){
    this.AFnewVideo = this.angularFire.database.object('/newVideo/'+this.pincode);      
    this.AFnewVideo.subscribe(snapshot => {
        console.log('subscribe new video result:'+this.userId);        
        console.log(snapshot);                
        if(snapshot.id == null || snapshot.id == this.userId)
            return;
        
        this.youtube.player.loadVideoById(snapshot.val);
        this.youtube.videoId = snapshot.val;
        this.vPlayer = true;
        this.onPlaying = true;
        this.seekVal = 0;
        console.log('yutube var:',this.youtube);
        //this.videoLength = this.youtube.player.getDuration();
    
    });
  }

  makeVideoChanges(given){
     /* console.log('given:',given);
      if(given.id != this.userId){
          if(given.val != undefined)
            this.onPlayerStateChange({'data':given.state,'val':given.val});
          else       
            this.onPlayerStateChange({'data':given.state});     
      } */

      switch(given.state){
        case YT.PlayerState.PLAYING:
                    this.youtube.player.playVideo();                    
                    this.onPlaying = true;
                    break;
        case YT.PlayerState.PAUSED:
                    this.youtube.player.pauseVideo();        
                    this.onPlaying = false;  
                    break
        case this.SEEK_VIDEO://seekto
                    this.youtube.player.seekTo(given.val);
                    this.seekVal = given.val;
                    break;
        default:
            break;
    }  
  }

  bindPlayer(elementId): void {
    this.youtube.playerId = elementId;
  };

  createPlayer(): void {
      
    return new YT.Player(this.youtube.playerId, {
      height: this.youtube.playerHeight,
      width: this.youtube.playerWidth,
      playerVars: {
        rel: 0,
        showinfo: 0,
        //controls:0,
        disablekb:0
      },
      events: {
            'onReady': (event => this.onPlayerReady(event)),
            'onStateChange': (event => this.onPlayerStateChange(event))
      }
    });
  }

  loadPlayer(): void {
    if (this.youtube.ready && this.youtube.playerId) {
      console.log('youtube:',this.youtube.player);
      console.log(this.youtube.player != null);
      console.log('CREATE PLAYER:',YT)
      if (this.youtube.player != null) {        
        //this.youtube.player.destroy();
      }
      this.youtube.player = this.createPlayer();
      console.log('playerID:',this.youtube.playerId);
      console.log('create player');
      console.log(this.youtube.player);
    }
  }

  setupPlayer () {
    //we need to check if the api is loaded
    /*window['onYouTubeIframeAPIReady'] = () => {
      if (window['YT']) {
         this.youtube.ready = true;
         this.bindPlayer('placeholder');
         this.loadPlayer();
      }
    };
    if (window.YT && window.YT.Player) {*/
         this.youtube.ready = true;
         this.bindPlayer('placeholder');
         this.loadPlayer();
    //}
  }

  launchPlayer(id):void {    
    this.youtube.player.loadVideoById(id);
    this.youtube.videoId = id;
    this.vPlayer = true;
    this.onPlaying = true;
    //this.zone.run(()=>{
      this.seekVal = 0;
    //});
    //this.videoLength = this.youtube.player.getDuration();
    this.AFnewVideo.set({'id':this.userId ,'state':this.START_VIDEO,'val':id,'time': this.getUTCTime()});
    return this.youtube;    
  }

  onPlayerReady(event){
    console.log('player ready',event);    
  }
  onPlayerStateChange(event){         
    if(event.data == YT.PlayerState.PLAYING){
      this.videoLength = this.youtube.player.getDuration();     
      this.onPlaying = true;                  
    }else if(event.data == YT.PlayerState.ENDED||
             event.data == YT.PlayerState.PAUSED){
      this.onPlaying = false;                  
    }
    /*
    console.log('player state change:',event,event.data);
    if(event == undefined || event.data == undefined)
        return;
    
    switch(event.data){
        case YT.PlayerState.ENDED:
                    this.onPlaying = false;    
                                break;
        case YT.PlayerState.PLAYING:
                    if(this.onPlaying == true)
                        return
                    this.videoLength = this.youtube.player.getDuration();
                    this.onPlaying = true;
                    this.AFvideoChanges.set({'id':this.userId ,'state':event.data,'time': this.getUTCTime()});
                                break;
        case YT.PlayerState.PAUSED:
                    if(this.onPlaying == false)
                        return
                    this.onPlaying = false;  
                    this.AFvideoChanges.set({'id':this.userId ,'state':event.data,'time': this.getUTCTime()});  
                                break
        case YT.PlayerState.BUFFERING:
                    this.onPlaying = false;
                                break;
        case YT.PlayerState.CUED:
            break;
        case this.START_VIDEO://start new Video   
            this.launchPlayer(event.val);
            break;
        case this.SEEK_VIDEO://seekto
            this.youtube.player.seekTo(event.val);
            break;
        default:
            break;
    }    */
  }

  //get utc time in seconds
  getUTCTime(){
      let tmp = ( new Date(Date.now()-(new Date().getTimezoneOffset()*60000)).getTime() );
      return tmp;
  }

  continuePlaying(){
    //if(this.youtube.player.)
    if(!this.onPlaying){
        this.youtube.player.playVideo();
        this.videoLength = this.youtube.player.getDuration();                   
        this.onPlaying = true;
        this.AFvideoChanges.set({'id':this.userId ,'state':YT.PlayerState.PLAYING,'time': this.getUTCTime()});                    
    }
  }
  pausePlaying(){
    if(this.onPlaying){
        this.youtube.player.pauseVideo();        
        this.onPlaying = false;  
        this.AFvideoChanges.set({'id':this.userId ,'state':YT.PlayerState.PAUSED,'time': this.getUTCTime()});                      
    }
  }
  onSeekPlaying(){
    console.log('seek Val:'+this.seekVal);
    console.log('seek:',event);
    this.AFvideoChanges.set({'id':this.userId ,'state':this.SEEK_VIDEO,'val':this.seekVal,'time': this.getUTCTime()});
    this.youtube.player.seekTo(this.seekVal);
  }

}