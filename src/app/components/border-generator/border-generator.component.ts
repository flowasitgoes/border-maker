import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { BorderService, BorderSettings } from '../../services/border.service';

@Component({
  selector: 'app-border-generator',
  templateUrl: './border-generator.component.html',
  styleUrls: ['./border-generator.component.scss']
})
export class BorderGeneratorComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  uploadedImage: string | null = null;
  galleryImages: string[] = [];
  isDragging = false;
  settings: BorderSettings = {
    borderWidth: 40,
    gridCountX: 8,
    gridCountY: 5,
    gridSize: 60,
    isReversed: false,
    fillingColor: '#f9a8d4'
  };

  showColorPicker = false;

  constructor(private borderService: BorderService) {}

  private subscriptions: any[] = [];

  ngOnInit(): void {
    const imageSub = this.borderService.uploadedImage$.subscribe(image => {
      this.uploadedImage = image;
    });
    this.subscriptions.push(imageSub);

    const gallerySub = this.borderService.galleryImages$.subscribe(images => {
      this.galleryImages = images;
    });
    this.subscriptions.push(gallerySub);

    const settingsSub = this.borderService.settings$.subscribe(settings => {
      this.settings = settings;
    });
    this.subscriptions.push(settingsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleImageUpload(file);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleImageUpload(file);
    }
  }

  handleImageUpload(file: File): void {
    if (!file.type.startsWith('image/')) {
      console.error('請選擇圖片文件');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('圖片文件太大，請選擇小於 10MB 的圖片');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.borderService.setUploadedImage(result);
    };
    reader.onerror = () => {
      console.error('讀取圖片文件時發生錯誤');
    };
    reader.readAsDataURL(file);
  }

  openFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  resetUpload(): void {
    this.borderService.setUploadedImage(null);
  }

  updateSetting(key: keyof BorderSettings, value: number): void {
    this.borderService.updateSettings({ [key]: value });
  }

  toggleReverse(): void {
    const newReversedState = !this.settings.isReversed;
    this.borderService.updateSettings({ isReversed: newReversedState });
  }

  openColorPicker(): void {
    this.showColorPicker = true;
  }

  closeColorPicker(): void {
    this.showColorPicker = false;
  }

  onColorChange(color: string): void {
    this.borderService.updateSettings({ fillingColor: color });
  }

  onGalleryImageClick(imageUrl: string): void {
    this.borderService.setUploadedImage(imageUrl);
  }
}
