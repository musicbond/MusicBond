import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { TabsPage } from '../tabs/tabs';

@Component({
  templateUrl: 'chats.html'
})
export class ChatsPage {
  
  constructor(public navCtrl: NavController) {

  }

  gotoChat(){
      this.navCtrl.setRoot(TabsPage);
  }
}
