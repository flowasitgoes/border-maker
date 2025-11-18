import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { BorderService, BorderSettings } from '../../services/border.service';
import { UploadService } from '../../services/upload.service';

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
  isUploading = false;

  constructor(
    private borderService: BorderService,
    private uploadService: UploadService
  ) {}

  private subscriptions: any[] = [];

  ngOnInit(): void {
    console.log('[BorderGenerator] 組件初始化');
    // 立即獲取當前值（從 localStorage 加載的歷史記錄）
    const currentImage = this.borderService.getUploadedImage();
    console.log('[BorderGenerator] 從服務獲取的當前圖片:', currentImage);
    if (currentImage) {
      this.uploadedImage = this.getImageUrl(currentImage);
      console.log('[BorderGenerator] 設置 uploadedImage:', this.uploadedImage);
    }
    this.galleryImages = this.borderService.getGalleryImages();
    console.log('[BorderGenerator] 從服務獲取的 Gallery 圖片數量:', this.galleryImages.length);
    console.log('[BorderGenerator] Gallery 圖片內容:', this.galleryImages);

    const imageSub = this.borderService.uploadedImage$.subscribe(image => {
      if (image) {
        // 如果是路徑，轉換為完整 URL；如果是 base64，直接使用
        if (image.startsWith('/uploads/') || image.startsWith('uploads/')) {
          this.uploadedImage = this.uploadService.getImageUrl(image);
        } else {
          this.uploadedImage = image; // base64 或完整 URL
        }
      } else {
        this.uploadedImage = null;
      }
    });
    this.subscriptions.push(imageSub);

    const gallerySub = this.borderService.galleryImages$.subscribe(images => {
      console.log('[BorderGenerator] Gallery 更新，新數量:', images.length);
      console.log('[BorderGenerator] Gallery 新內容:', images);
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
    console.log('[BorderGenerator] 開始處理圖片上傳');
    console.log('[BorderGenerator] 文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!file.type.startsWith('image/')) {
      console.error('[BorderGenerator] 錯誤: 不是圖片文件');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('[BorderGenerator] 錯誤: 文件太大', file.size, 'bytes');
      return;
    }

    // 上傳文件到服務器
    console.log('[BorderGenerator] 設置 isUploading = true');
    this.isUploading = true;
    
    console.log('[BorderGenerator] 調用 uploadService.uploadImage()');
    this.uploadService.uploadImage(file).subscribe({
      next: (response) => {
        console.log('[BorderGenerator] 上傳成功，收到響應:', response);
        if (response.success) {
          // 使用文件路徑而不是 base64
          const imagePath = response.filePath;
          console.log('[BorderGenerator] 圖片路徑:', imagePath);
          
          console.log('[BorderGenerator] 調用 borderService.setUploadedImage()');
          this.borderService.setUploadedImage(imagePath);
          
          // 同時顯示預覽（使用服務器 URL）
          const imageUrl = this.uploadService.getImageUrl(imagePath);
          console.log('[BorderGenerator] 圖片 URL:', imageUrl);
          // 暫時使用 URL 顯示預覽，但存儲的是路徑
          this.uploadedImage = imageUrl;
          console.log('[BorderGenerator] uploadedImage 已設置為:', this.uploadedImage);
        } else {
          console.warn('[BorderGenerator] 響應中 success 為 false');
        }
        this.isUploading = false;
        console.log('[BorderGenerator] 設置 isUploading = false');
      },
      error: (error) => {
        console.error('[BorderGenerator] 上傳圖片失敗');
        console.error('[BorderGenerator] 錯誤詳情:', error);
        console.error('[BorderGenerator] 錯誤狀態:', error.status);
        console.error('[BorderGenerator] 錯誤消息:', error.message);
        console.error('[BorderGenerator] 完整錯誤對象:', JSON.stringify(error, null, 2));
        this.isUploading = false;
        console.log('[BorderGenerator] 回退到 base64 方式');
        // 如果上傳失敗，回退到 base64 方式
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          console.log('[BorderGenerator] Base64 轉換成功，長度:', result.length);
          this.borderService.setUploadedImage(result);
        };
        reader.onerror = () => {
          console.error('[BorderGenerator] 讀取圖片文件時發生錯誤');
        };
        reader.readAsDataURL(file);
      }
    });
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

  getImageUrl(imagePath: string): string {
    // 如果是路徑，轉換為完整 URL；如果是 base64 或完整 URL，直接返回
    if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
      return this.uploadService.getImageUrl(imagePath);
    }
    return imagePath; // base64 或完整 URL
  }

  onDeleteImage(event: Event, imagePath: string): void {
    event.stopPropagation(); // 阻止觸發點擊選擇圖片的事件
    console.log('[BorderGenerator] 刪除圖片:', imagePath);
    
    if (confirm('確定要刪除這張圖片嗎？')) {
      this.borderService.deleteImage(imagePath);
    }
  }
}
