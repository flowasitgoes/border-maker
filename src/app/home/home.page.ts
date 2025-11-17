import { Component, OnInit, OnDestroy } from '@angular/core';
import { BorderService } from '../services/border.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  uploadedImage: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private borderService: BorderService) {}

  ngOnInit(): void {
    const imageSub = this.borderService.uploadedImage$.subscribe(image => {
      this.uploadedImage = image;
    });
    this.subscriptions.push(imageSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  resetUpload(): void {
    this.borderService.setUploadedImage(null);
  }
}

