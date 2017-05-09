import { Component } from '@angular/core';
import { NavController,NavParams } from 'ionic-angular';
import { AlertController,LoadingController } from 'ionic-angular';

import { ChatsPage } from '../chats/chats';
import { TabsPage } from '../tabs/tabs';
import {  AngularFireOffline } from 'angularfire2-offline';
import { SocialSharing } from '@ionic-native/social-sharing';

@Component({
  templateUrl: 'pincode.html'
})
export class PincodePage {
  user;
  userId;
  isPincodeGenerated = false;
  generatedCode;
  fullPinCodes;
  constructor(public navCtrl: NavController,
             public alertCtrl: AlertController,
             public loadingCtrl:LoadingController,
             public params: NavParams,
             public afo: AngularFireOffline,
             public socialSharing: SocialSharing) {               
    this.userId = params.data.userId;
    let userObj=this.afo.database.object('users/'+this.userId);
    this.fullPinCodes=this.afo.database.list('pincodes');
    this.user = userObj;
    console.log('in pincode page:',this.userId,'::',userObj);
   
    let subscribed = userObj.first().subscribe( snapshot =>{
      console.log('user object subscribed:',snapshot);
      if(snapshot == undefined )
            return;        
      if(snapshot.isPaired == false){
        if(snapshot.isPinCodeGenerated == true){
            this.generatedCode = snapshot.pincode; 
            this.isPincodeGenerated = true;
        }else{
          //this.askPincode();
          //nothing to do here
        }
      }else{
        this.generatedCode = snapshot.pincode; 
        this.navCtrl.setRoot(TabsPage,{userId:this.userId,pincode:this.generatedCode});
      }
      //subscribed.unsubscribe();
    });
   
    console.log('pcode: username:',this.user);
  }

  validatePin(){
      if(this.user == undefined)
          this.showAlert('Sorry','Please check app permissions & Internet Connection');
      //if ispincodeGenerated == false do ispaired true to both people and frwd to tabs page
      //this.navCtrl.setRoot(ChatsPage);
      //this.navCtrl.pop();
      //this.navCtrl.setRoot(AfterPincodeClass, { userName: this.user.value.name,partnerName:partnetName });

      this.user.update({
        isPinCodeGenerated:true,
        pincode:this.generatedCode
        //,isPaired:true      
      });
      this.navCtrl.setRoot(TabsPage,{userId:this.userId,pincode:this.generatedCode});
  }

  askPincode(){
    //this.showAlert(code);
    let code=this.getFveDigitRand();
    this.generatedCode = code; 
    this.isPincodeGenerated = true;    
    //this.regularShare(code);    
    this.user.update({
      isPinCodeGenerated:true,
      pincode:this.generatedCode      
    });
    //this should be pincode owner partner
    this.fullPinCodes.push(code);
  }

  regularShare(code){
    this.socialSharing.share("Use this code{ "+code+" } to start MusicBond",
                              null,                              
                              "www/assets/login.jpg",
                              null); 
  }


  showAlert(title,msg) {
    let alert = this.alertCtrl.create({
      title: ''+title,
      subTitle: ''+msg,
      buttons: ['OK']
    });
    alert.present();
  }

  getFveDigitRand(){
      console.log('this.fullPinCodes',this.fullPinCodes);
      let code = Math.floor(Math.random()*90000) + 10000;
      let cnt=0;
      while( this.fullPinCodes.value.filter(obj => obj.$value == code).length > 0){
        console.log('1 code exists',code);
        code = Math.floor(Math.random()*90000) + 10000;
        cnt++;
        if(cnt == 1000)
          break;          
      }
      cnt=0;
      while( this.fullPinCodes.value.filter(obj => obj.$value == code).length > 0){
        console.log('2 code exists',code);
        code = Math.floor(Math.random()*900000) + 100000;
        cnt++;
        if(cnt == 1500)
          break;          
      }
      return code;
  }
 
}


@Component({
  template: `
    <ion-header>
      <ion-navbar>
        <ion-title>
          Matched
        </ion-title>
      </ion-navbar>
    </ion-header>

    <ion-content id="matchedContent" padding>
      <ion-icon [name]="happy" [ngStyle]="{'color': secondary}"></ion-icon>
      You Matched with {{partnerName}}
    </ion-content>

    <ion-footer>
      <button style="margin:0px;" (click)="gotoManScreen()" ion-button full>
        Next
        <ion-icon name="arrow-round-forward"></ion-icon>
      </button>
    </ion-footer>
  `
})
export class AfterPincodeClass{
  partnerName;
  userName;
  constructor(public navCtrl: NavController,
              public params: NavParams){
                
    this.userName = params.data.userName;
    this.partnerName = params.data.partnerName;
  }
  gotoManScreen(){
    this.navCtrl.setRoot(TabsPage);
  }
}