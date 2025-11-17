import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BorderSettings {
  borderWidth: number;
  gridCountX: number;
  gridCountY: number;
  gridSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class BorderService {
  private uploadedImageSubject = new BehaviorSubject<string | null>(null);
  public uploadedImage$: Observable<string | null> = this.uploadedImageSubject.asObservable();

  private settingsSubject = new BehaviorSubject<BorderSettings>({
    borderWidth: 40,
    gridCountX: 8,
    gridCountY: 5,
    gridSize: 60
  });
  public settings$: Observable<BorderSettings> = this.settingsSubject.asObservable();

  setUploadedImage(image: string | null): void {
    this.uploadedImageSubject.next(image);
  }

  getUploadedImage(): string | null {
    return this.uploadedImageSubject.value;
  }

  updateSettings(settings: Partial<BorderSettings>): void {
    const currentSettings = this.settingsSubject.value;
    this.settingsSubject.next({ ...currentSettings, ...settings });
  }

  getSettings(): BorderSettings {
    return this.settingsSubject.value;
  }
}

