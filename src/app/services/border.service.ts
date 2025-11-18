import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BorderSettings {
  borderWidth: number;
  gridCountX: number;
  gridCountY: number;
  gridSize: number;
  isReversed?: boolean;
  fillingColor?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BorderService {
  private uploadedImageSubject = new BehaviorSubject<string | null>(null);
  public uploadedImage$: Observable<string | null> = this.uploadedImageSubject.asObservable();

  private galleryImagesSubject = new BehaviorSubject<string[]>([]);
  public galleryImages$: Observable<string[]> = this.galleryImagesSubject.asObservable();

  private settingsSubject = new BehaviorSubject<BorderSettings>({
    borderWidth: 40,
    gridCountX: 8,
    gridCountY: 5,
    gridSize: 60,
    isReversed: false,
    fillingColor: '#f9a8d4'
  });
  public settings$: Observable<BorderSettings> = this.settingsSubject.asObservable();

  setUploadedImage(image: string | null): void {
    this.uploadedImageSubject.next(image);
    // 將新上傳的圖片添加到Gallery（避免重複）
    if (image) {
      const currentGallery = this.galleryImagesSubject.value;
      if (!currentGallery.includes(image)) {
        this.galleryImagesSubject.next([image, ...currentGallery]);
      }
    }
  }

  getUploadedImage(): string | null {
    return this.uploadedImageSubject.value;
  }

  getGalleryImages(): string[] {
    return this.galleryImagesSubject.value;
  }

  updateSettings(settings: Partial<BorderSettings>): void {
    const currentSettings = this.settingsSubject.value;
    this.settingsSubject.next({ ...currentSettings, ...settings });
  }

  getSettings(): BorderSettings {
    return this.settingsSubject.value;
  }
}

