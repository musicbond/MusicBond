import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { PincodePage } from '../pincode/pincode';
import { TabsPage } from '../tabs/tabs';

import { AngularFire } from 'angularfire2';
import {  AngularFireOffline } from 'angularfire2-offline';
import { GooglePlus } from '@ionic-native/google-plus';
import * as firebase from 'firebase'

//import { Network } from '@ionic-native/network';

@Component({
  templateUrl: 'login.html'
})
export class LoginPage {

  constructor(public navCtrl: NavController,
              public af: AngularFire,
              public afo: AngularFireOffline,
              private googlePlus: GooglePlus
              ) {
        let subscribed = this.af.auth.subscribe(user => {
            if(user!=undefined) {
                // user logged in
                subscribed.unsubscribe();
                this.redirectTo(user.uid,user.google);
            }
            else {
                // user not logged in                
            }
            console.log('USER::',user);
        });
       // this.trackOnlineOfflineStatus();
       // this.trackNetworkStatus();
  }

  googlePlusLogin(){
     this.googlePlus.login({
      'webClientId': '528240254855-t66thkkmikd5ei5u1901mmc7546lcf9h.apps.googleusercontent.com'
    })
      .then((res) => {
        const firecreds = firebase.auth.GoogleAuthProvider.credential(res.idToken);
        firebase.auth().signInWithCredential(firecreds).then((res) => {
          //this.navCtrl.setRoot(HomePage);
        }).catch((err) => {
          alert('Firebase auth failed' + err);
        })        
      }).catch((err) => {
        alert('Error' + err);
    });
  }

  redirectTo(uid,user){
    let fireUserObj=this.afo.database.object('users/'+uid);
    console.log('fire user: ',fireUserObj)
    console.log('afo:',this.afo);
    let subscribed = fireUserObj.first().subscribe( snapshot =>{  
        console.log("fire user subscribe:",snapshot)      
        if( snapshot.$exists() == false){
            console.log('-------------setting new user-------------');
            fireUserObj.set({
                uid: uid,
                name:user.displayName,
                email:user.email,
                picture:user.photoURL, 
                isPinCodeGenerated:false,
                isPaired:false            
            });
        }
        //subscribed.unsubscribe();
        console.log("redirecting to pincode page");
        this.navCtrl.setRoot(PincodePage,{userId:uid});
    });
    
  }

}
