import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { BorderService } from '../services/border.service';
import { UploadService } from '../services/upload.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  
  uploadedImage: string | null = null;
  isUploading = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private borderService: BorderService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    const imageSub = this.borderService.uploadedImage$.subscribe(image => {
      this.uploadedImage = image;
    });
    this.subscriptions.push(imageSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  openFileInput(): void {
    console.log('[HomePage] 打開文件選擇器');
    this.fileInput.nativeElement.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      console.log('[HomePage] 處理文件上傳:', file.name);
      this.handleImageUpload(file);
    }
    // 重置 input，以便可以再次選擇同一個文件
    input.value = '';
  }

  handleImageUpload(file: File): void {
    if (!file.type.startsWith('image/')) {
      console.error('[HomePage] 錯誤: 不是圖片文件');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('[HomePage] 錯誤: 文件太大', file.size, 'bytes');
      return;
    }

    // 上傳文件到服務器
    console.log('[HomePage] 設置 isUploading = true');
    this.isUploading = true;
    
    console.log('[HomePage] 調用 uploadService.uploadImage()');
    this.uploadService.uploadImage(file).subscribe({
      next: (response) => {
        console.log('[HomePage] 上傳成功，收到響應:', response);
        if (response.success) {
          // 優先使用 base64（Vercel 環境），否則使用文件路徑
          const imageData = response.imageDataUrl || response.filePath;
          console.log('[HomePage] 圖片數據:', imageData ? '已設置' : '未設置');
          console.log('[HomePage] 是否 Vercel 環境:', response.isVercel);
          
          if (imageData) {
            console.log('[HomePage] 調用 borderService.setUploadedImage()');
            this.borderService.setUploadedImage(imageData);
          } else {
            console.warn('[HomePage] 響應中沒有圖片數據');
          }
        }
        this.isUploading = false;
        console.log('[HomePage] 設置 isUploading = false');
      },
      error: (error) => {
        console.error('[HomePage] 上傳圖片失敗:', error);
        this.isUploading = false;
        // 如果上傳失敗，回退到 base64 方式
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          console.log('[HomePage] Base64 轉換成功，長度:', result.length);
          this.borderService.setUploadedImage(result);
        };
        reader.onerror = () => {
          console.error('[HomePage] 讀取圖片文件時發生錯誤');
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

