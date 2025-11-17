import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { BorderGeneratorComponent } from '../components/border-generator/border-generator.component';
import { BorderGridPreviewComponent } from '../components/border-grid-preview/border-grid-preview.component';
import { BorderPreviewComponent } from '../components/border-preview/border-preview.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [
    HomePage,
    BorderGeneratorComponent,
    BorderGridPreviewComponent,
    BorderPreviewComponent
  ]
})
export class HomePageModule {}

