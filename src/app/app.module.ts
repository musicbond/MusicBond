import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
//import {ChatsPage} from '../pages/chats/chats';
import {PincodePage,AfterPincodeClass} from '../pages/pincode/pincode';
import {LoginPage} from '../pages/login/login';
import {ImageModel} from '../pages/others/imageModel/imageModel'

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { Network } from '@ionic-native/network';
import { FileChooser } from '@ionic-native/file-chooser';
import { File } from '@ionic-native/file';
import { Transfer } from '@ionic-native/transfer'
import { GooglePlus } from '@ionic-native/google-plus';
import { SocialSharing } from '@ionic-native/social-sharing';
//import { FilePath } from '@ionic-native/file-path';

import {HttpModule } from '@angular/http';

// Import the AF2 Module
import {  AngularFireModule } from 'angularfire2';
import { AngularFireOfflineModule } from 'angularfire2-offline';

// AF2 Settings
export const firebaseConfig = {
    apiKey: "AIzaSyCgVBHbDxCWQ9uGcxrD4n8-3k4QMuFg4KU",
    authDomain: "musicbond-633b9.firebaseapp.com",
    databaseURL: "https://musicbond-633b9.firebaseio.com",
    projectId: "musicbond-633b9",
    storageBucket: "musicbond-633b9.appspot.com",
    messagingSenderId: "528240254855"
  };
  
@NgModule({
  declarations: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    LoginPage,
    PincodePage,
    AfterPincodeClass,
    ImageModel
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireOfflineModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
     AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    LoginPage,
    PincodePage,
    AfterPincodeClass,
    ImageModel
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Network,
    FileChooser,
    File,
    Transfer,
    GooglePlus,
    SocialSharing,
   // FilePath,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
