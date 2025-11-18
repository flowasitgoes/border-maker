import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UploadService } from './upload.service';

export interface BorderSettings {
  borderWidth: number;
  gridCountX: number;
  gridCountY: number;
  gridSize: number;
  isReversed?: boolean;
  fillingColor?: string;
}

const STORAGE_KEY_GALLERY = 'border-maker-gallery-images';
const STORAGE_KEY_CURRENT_IMAGE = 'border-maker-current-image';

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

  constructor(private uploadService: UploadService) {
    // 臨時清空 localStorage（測試用）
    console.log('[BorderService] 清空 localStorage');
    localStorage.removeItem(STORAGE_KEY_GALLERY);
    localStorage.removeItem(STORAGE_KEY_CURRENT_IMAGE);
    console.log('[BorderService] localStorage 已清空');
    
    // 從 localStorage 加載歷史記錄（現在應該是空的）
    this.loadFromLocalStorage();
    // 從服務器加載圖片列表
    this.loadImagesFromServer();
  }

  private loadImagesFromServer(): void {
    console.log('[BorderService] 開始從服務器加載圖片列表');
    this.uploadService.getImageList().subscribe({
      next: (response) => {
        console.log('[BorderService] 從服務器收到響應:', response);
        if (response.success && response.images.length > 0) {
          console.log('[BorderService] 服務器圖片數量:', response.images.length);
          // 將服務器上的圖片路徑添加到 Gallery
          const serverImagePaths = response.images.map(img => img.path);
          console.log('[BorderService] 服務器圖片路徑:', serverImagePaths);
          const currentGallery = this.galleryImagesSubject.value;
          console.log('[BorderService] 當前 Gallery:', currentGallery);
          
          // 合併服務器圖片和本地存儲的圖片（避免重複）
          const mergedGallery = [...new Set([...serverImagePaths, ...currentGallery])];
          console.log('[BorderService] 合併後的 Gallery:', mergedGallery);
          this.galleryImagesSubject.next(mergedGallery);
          this.saveToLocalStorage();
        } else {
          console.log('[BorderService] 服務器沒有圖片或響應失敗');
        }
      },
      error: (error) => {
        console.warn('[BorderService] 無法從服務器加載圖片列表，使用本地存儲');
        console.warn('[BorderService] 錯誤詳情:', error);
      }
    });
  }

  private loadFromLocalStorage(): void {
    try {
      console.log('[BorderService] 開始從 localStorage 加載數據');
      // 加載 Gallery 圖片
      const savedGallery = localStorage.getItem(STORAGE_KEY_GALLERY);
      console.log('[BorderService] localStorage 中的 Gallery 數據:', savedGallery);
      if (savedGallery) {
        const galleryImages = JSON.parse(savedGallery) as string[];
        console.log('[BorderService] 解析後的 Gallery 圖片:', galleryImages);
        if (Array.isArray(galleryImages) && galleryImages.length > 0) {
          console.log('[BorderService] 設置 Gallery 圖片，數量:', galleryImages.length);
          this.galleryImagesSubject.next(galleryImages);
        } else {
          console.log('[BorderService] Gallery 為空或不是數組');
        }
      } else {
        console.log('[BorderService] localStorage 中沒有 Gallery 數據');
      }

      // 加載當前選中的圖片
      const savedCurrentImage = localStorage.getItem(STORAGE_KEY_CURRENT_IMAGE);
      console.log('[BorderService] localStorage 中的當前圖片:', savedCurrentImage);
      if (savedCurrentImage) {
        console.log('[BorderService] 設置當前圖片');
        this.uploadedImageSubject.next(savedCurrentImage);
      } else {
        console.log('[BorderService] localStorage 中沒有當前圖片');
      }
      console.log('[BorderService] localStorage 加載完成');
    } catch (error) {
      console.error('[BorderService] 從 localStorage 加載數據時發生錯誤:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      console.log('[BorderService] 開始保存到 localStorage');
      // 保存 Gallery 圖片
      const galleryImages = this.galleryImagesSubject.value;
      console.log('[BorderService] Gallery 圖片數量:', galleryImages.length);
      console.log('[BorderService] Gallery 圖片內容:', galleryImages);
      localStorage.setItem(STORAGE_KEY_GALLERY, JSON.stringify(galleryImages));
      console.log('[BorderService] Gallery 已保存到 localStorage');

      // 保存當前選中的圖片
      const currentImage = this.uploadedImageSubject.value;
      console.log('[BorderService] 當前圖片:', currentImage);
      if (currentImage) {
        localStorage.setItem(STORAGE_KEY_CURRENT_IMAGE, currentImage);
        console.log('[BorderService] 當前圖片已保存到 localStorage');
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_IMAGE);
        console.log('[BorderService] 當前圖片已從 localStorage 移除');
      }
      console.log('[BorderService] localStorage 保存完成');
    } catch (error) {
      console.error('[BorderService] 保存到 localStorage 時發生錯誤:', error);
      // 如果存儲空間不足，嘗試清理舊數據
      if (error instanceof DOMException && error.code === 22) {
        console.warn('[BorderService] localStorage 空間不足，嘗試清理舊數據');
        this.clearOldImages();
      }
    }
  }

  private clearOldImages(): void {
    // 如果存儲空間不足，保留最新的 10 張圖片
    const currentGallery = this.galleryImagesSubject.value;
    if (currentGallery.length > 10) {
      const recentImages = currentGallery.slice(0, 10);
      this.galleryImagesSubject.next(recentImages);
      try {
        localStorage.setItem(STORAGE_KEY_GALLERY, JSON.stringify(recentImages));
      } catch (e) {
        console.error('清理後仍無法保存:', e);
      }
    }
  }

  setUploadedImage(image: string | null): void {
    console.log('[BorderService] setUploadedImage 被調用');
    console.log('[BorderService] 圖片值:', image);
    
    this.uploadedImageSubject.next(image);
    console.log('[BorderService] uploadedImageSubject 已更新');
    
    // 將新上傳的圖片添加到Gallery（避免重複）
    if (image) {
      const currentGallery = this.galleryImagesSubject.value;
      console.log('[BorderService] 當前 Gallery 圖片數量:', currentGallery.length);
      console.log('[BorderService] 當前 Gallery 內容:', currentGallery);
      
      if (!currentGallery.includes(image)) {
        console.log('[BorderService] 圖片不在 Gallery 中，添加到 Gallery');
        this.galleryImagesSubject.next([image, ...currentGallery]);
        console.log('[BorderService] Gallery 已更新，新數量:', this.galleryImagesSubject.value.length);
      } else {
        console.log('[BorderService] 圖片已在 Gallery 中，跳過添加');
      }
    }
    // 保存到 localStorage
    console.log('[BorderService] 調用 saveToLocalStorage()');
    this.saveToLocalStorage();
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

  deleteImage(imagePath: string): void {
    console.log('[BorderService] 開始刪除圖片');
    console.log('[BorderService] 圖片路徑:', imagePath);
    
    // 如果是 base64 圖片，只從 Gallery 中移除，不調用服務器 API
    if (imagePath.startsWith('data:image/')) {
      console.log('[BorderService] 這是 base64 圖片，只從 Gallery 中移除');
      const currentGallery = this.galleryImagesSubject.value;
      const updatedGallery = currentGallery.filter(path => path !== imagePath);
      
      if (updatedGallery.length !== currentGallery.length) {
        this.galleryImagesSubject.next(updatedGallery);
        
        // 如果當前選中的圖片被刪除，清空當前圖片
        const currentImage = this.uploadedImageSubject.value;
        if (currentImage === imagePath) {
          console.log('[BorderService] 當前選中的圖片被刪除，清空當前圖片');
          this.uploadedImageSubject.next(null);
        }
        
        this.saveToLocalStorage();
        console.log('[BorderService] Base64 圖片已從 Gallery 中移除');
      }
      return;
    }
    
    // 如果是服務器上的圖片，調用 API 刪除
    console.log('[BorderService] 這是服務器圖片，調用 API 刪除');
    this.uploadService.deleteImage(imagePath).subscribe({
      next: (response) => {
        console.log('[BorderService] 服務器刪除響應:', response);
        if (response.success) {
          // 從 Gallery 中移除
          const currentGallery = this.galleryImagesSubject.value;
          const updatedGallery = currentGallery.filter(path => {
            // 匹配各種可能的路徑格式
            const pathUrl = this.uploadService.getImageUrl(path);
            const targetUrl = this.uploadService.getImageUrl(imagePath);
            return pathUrl !== targetUrl && path !== imagePath;
          });
          
          console.log('[BorderService] 更新後的 Gallery 數量:', updatedGallery.length);
          this.galleryImagesSubject.next(updatedGallery);
          
          // 如果當前選中的圖片被刪除，清空當前圖片
          const currentImage = this.uploadedImageSubject.value;
          const currentImageUrl = currentImage ? this.uploadService.getImageUrl(currentImage) : '';
          const deletedImageUrl = this.uploadService.getImageUrl(imagePath);
          
          if (currentImage === imagePath || currentImageUrl === deletedImageUrl) {
            console.log('[BorderService] 當前選中的圖片被刪除，清空當前圖片');
            this.uploadedImageSubject.next(null);
          }
          
          // 保存到 localStorage
          this.saveToLocalStorage();
          console.log('[BorderService] 圖片已從 Gallery 和服務器刪除');
        }
      },
      error: (error) => {
        console.error('[BorderService] 刪除圖片失敗:', error);
        // 即使服務器刪除失敗，也嘗試從 Gallery 中移除
        const currentGallery = this.galleryImagesSubject.value;
        const updatedGallery = currentGallery.filter(path => {
          const pathUrl = this.uploadService.getImageUrl(path);
          const targetUrl = this.uploadService.getImageUrl(imagePath);
          return pathUrl !== targetUrl && path !== imagePath;
        });
        
        if (updatedGallery.length !== currentGallery.length) {
          this.galleryImagesSubject.next(updatedGallery);
          this.saveToLocalStorage();
          console.log('[BorderService] 服務器刪除失敗，但已從 Gallery 中移除');
        }
      }
    });
  }
}

