import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private platform: Platform) {}

  async ngOnInit() {
    await this.platform.ready();
    this.initializeApp();
  }

  async initializeApp() {
    if (this.platform.is('capacitor')) {
      try {
        // 設置狀態欄樣式
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#1e293b' });
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    }
  }
}
