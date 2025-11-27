import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { BorderService, BorderSettings } from '../../services/border.service';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-border-generator',
  templateUrl: './border-generator.component.html',
  styleUrls: ['./border-generator.component.scss']
})
export class BorderGeneratorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('gridPanel', { static: false }) gridPanel!: ElementRef<HTMLDivElement>;

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
          // 優先使用 base64（Vercel 環境），否則使用文件路徑
          const imageData = response.imageDataUrl || response.filePath;
          console.log('[BorderGenerator] 圖片數據:', imageData ? '已設置' : '未設置');
          console.log('[BorderGenerator] 是否 Vercel 環境:', response.isVercel);
          
          if (imageData) {
            console.log('[BorderGenerator] 調用 borderService.setUploadedImage()');
            this.borderService.setUploadedImage(imageData);
            
            // 如果是 base64，直接使用；否則使用服務器 URL
            if (response.imageDataUrl) {
              this.uploadedImage = response.imageDataUrl;
            } else if (response.filePath) {
              const imageUrl = this.uploadService.getImageUrl(response.filePath);
              console.log('[BorderGenerator] 圖片 URL:', imageUrl);
              this.uploadedImage = imageUrl;
            }
            console.log('[BorderGenerator] uploadedImage 已設置為:', this.uploadedImage ? '已設置' : '未設置');
          } else {
            console.warn('[BorderGenerator] 響應中沒有圖片數據');
          }
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

  ngAfterViewInit(): void {
    // ViewChild 在 AfterViewInit 後才可用
  }

  // 等待所有圖片加載完成
  private async waitForImages(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img, [style*="background-image"]');
    const promises: Promise<void>[] = [];

    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        if (img.complete) {
          return;
        }
        promises.push(
          new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // 即使失敗也繼續
            // 設置超時
            setTimeout(() => resolve(), 5000);
          })
        );
      } else {
        // 處理背景圖片
        const bgImage = window.getComputedStyle(img).backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (urlMatch && urlMatch[1]) {
            const imgUrl = urlMatch[1];
            promises.push(
              new Promise<void>((resolve) => {
                const testImg = new Image();
                testImg.onload = () => resolve();
                testImg.onerror = () => resolve();
                testImg.src = imgUrl;
                setTimeout(() => resolve(), 5000);
              })
            );
          }
        }
      }
    });

    await Promise.all(promises);
  }

  async exportGridAsImage(): Promise<void> {
    console.log('[BorderGenerator] 開始導出圖片...');
    console.log('[BorderGenerator] gridPanel 引用:', this.gridPanel);
    
    if (!this.gridPanel) {
      console.error('[BorderGenerator] gridPanel 引用不存在');
      alert('無法找到網格面板，請確保已上傳圖片');
      return;
    }

    const gridPanelElement = this.gridPanel.nativeElement;
    console.log('[BorderGenerator] gridPanelElement:', gridPanelElement);
    
    if (!gridPanelElement) {
      console.error('[BorderGenerator] gridPanel DOM 元素不存在');
      alert('無法找到網格面板元素');
      return;
    }

    // 查找 grid-container 元素（實際的網格容器）
    const gridContainer = gridPanelElement.querySelector('.grid-container') as HTMLElement;
    console.log('[BorderGenerator] gridContainer:', gridContainer);
    
    if (!gridContainer) {
      console.error('[BorderGenerator] 無法找到 grid-container 元素');
      alert('無法找到網格容器，請確保網格已正確渲染');
      return;
    }

    // 使用 grid-container 作為截圖目標
    const gridElement = gridContainer;
    
    // 檢查元素是否可見
    if (gridElement.offsetWidth === 0 || gridElement.offsetHeight === 0) {
      console.error('[BorderGenerator] 網格容器不可見');
      console.log('[BorderGenerator] 元素尺寸:', {
        width: gridElement.offsetWidth,
        height: gridElement.offsetHeight,
        display: window.getComputedStyle(gridElement).display
      });
      alert('網格容器不可見，請確保已上傳圖片並顯示網格');
      return;
    }

    try {
      // 等待 DOM 完全渲染
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 等待所有圖片加載完成
      console.log('[BorderGenerator] 等待圖片加載...');
      await this.waitForImages(gridElement);
      console.log('[BorderGenerator] 圖片加載完成');
      
      // 再次等待確保渲染完成
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      console.log('[BorderGenerator] 動態導入 html2canvas...');
      
      // 動態導入 html2canvas
      const html2canvas = await import('html2canvas');
      const html2canvasFunc = html2canvas.default || html2canvas;
      
      console.log('[BorderGenerator] html2canvas 導入成功，開始截圖...');
      console.log('[BorderGenerator] 元素尺寸:', {
        width: gridElement.offsetWidth,
        height: gridElement.offsetHeight,
        scrollWidth: gridElement.scrollWidth,
        scrollHeight: gridElement.scrollHeight
      });
      
      // 使用 html2canvas 截取 grid-container 中的內容
      const canvas = await html2canvasFunc(gridElement, {
        backgroundColor: '#ffffff', // 白色背景，匹配 grid-container 的背景色
        scale: 2, // 提高圖片質量
        logging: false, // 關閉日誌以減少錯誤
        useCORS: true, // 允許跨域圖片
        allowTaint: true, // 允許跨域圖片污染 canvas
        foreignObjectRendering: false, // 禁用 foreignObject 渲染
        removeContainer: true, // 移除容器
        imageTimeout: 15000, // 圖片加載超時時間
        onclone: (clonedDoc: Document) => {
          // 在克隆的文檔中確保所有元素都正確
          const clonedElement = clonedDoc.querySelector('.grid-container');
          if (clonedElement) {
            console.log('[BorderGenerator] 在克隆文檔中找到元素');
          } else {
            console.warn('[BorderGenerator] 在克隆文檔中未找到元素');
          }
        }
      });

      console.log('[BorderGenerator] 截圖完成，canvas 尺寸:', {
        width: canvas.width,
        height: canvas.height
      });

      // 將 canvas 轉換為 JPG 格式的 blob
      return new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('[BorderGenerator] 無法創建圖片 blob');
            alert('無法創建圖片文件');
            reject(new Error('無法創建圖片 blob'));
            return;
          }

          console.log('[BorderGenerator] Blob 創建成功，大小:', blob.size);

          // 創建下載鏈接
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // 生成文件名（包含網格設置信息）
          const filename = `border-grid-${this.settings.gridCountX}x${this.settings.gridCountY}-${this.settings.gridSize}px.jpg`;
          link.download = filename;
          
          // 觸發下載
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // 釋放 URL 對象
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 100);
          
          console.log('[BorderGenerator] 圖片導出成功:', filename);
          resolve();
        }, 'image/jpeg', 0.95); // JPG 格式，質量 95%
      });
      
    } catch (error: any) {
      console.error('[BorderGenerator] 導出圖片時發生錯誤:', error);
      console.error('[BorderGenerator] 錯誤詳情:', {
        message: error?.message || String(error),
        stack: error?.stack,
        name: error?.name,
        toString: error?.toString()
      });
      
      const errorMessage = error?.message || error?.toString() || '未知錯誤';
      console.error('[BorderGenerator] 完整錯誤對象:', error);
      
      // 嘗試使用備用方法：直接使用 Canvas API 繪製
      if (errorMessage.includes('iframe') || errorMessage.includes('Unable to find element')) {
        console.log('[BorderGenerator] 嘗試使用備用方法...');
        try {
          await this.exportGridAsCanvas(gridElement);
          return;
        } catch (fallbackError: any) {
          console.error('[BorderGenerator] 備用方法也失敗:', fallbackError);
          alert(`導出圖片失敗: ${errorMessage}。請檢查瀏覽器控制台獲取更多信息。`);
        }
      } else {
        alert(`導出圖片失敗: ${errorMessage}。請檢查瀏覽器控制台獲取更多信息。`);
      }
    }
  }

  // 備用方法：使用 Canvas API 直接繪製
  private async exportGridAsCanvas(gridElement: HTMLElement): Promise<void> {
    console.log('[BorderGenerator] 使用 Canvas API 備用方法...');
    
    const width = gridElement.offsetWidth;
    const height = gridElement.offsetHeight;
    
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // 2x 縮放
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('無法創建 Canvas 上下文');
    }
    
    // 設置白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 縮放上下文
    ctx.scale(2, 2);
    
    // 獲取所有網格單元格
    const cells = gridElement.querySelectorAll('.grid-cell');
    console.log('[BorderGenerator] 找到網格單元格數量:', cells.length);
    
    // 繪製每個單元格
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i] as HTMLElement;
      const rect = cell.getBoundingClientRect();
      const gridRect = gridElement.getBoundingClientRect();
      
      const x = rect.left - gridRect.left;
      const y = rect.top - gridRect.top;
      const w = rect.width;
      const h = rect.height;
      
      // 獲取單元格樣式
      const computedStyle = window.getComputedStyle(cell);
      const bgColor = computedStyle.backgroundColor;
      const bgImage = computedStyle.backgroundImage;
      const borderColor = computedStyle.borderColor;
      const borderWidth = parseInt(computedStyle.borderWidth) || 0;
      
      // 繪製背景色
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);
      }
      
      // 繪製背景圖片
      if (bgImage && bgImage !== 'none') {
        const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image();
              image.crossOrigin = 'anonymous';
              image.onload = () => resolve(image);
              image.onerror = reject;
              image.src = urlMatch[1];
              setTimeout(() => reject(new Error('圖片加載超時')), 5000);
            });
            
            ctx.drawImage(img, x, y, w, h);
          } catch (imgError) {
            console.warn('[BorderGenerator] 無法加載背景圖片:', urlMatch[1]);
          }
        }
      }
      
      // 繪製邊框
      if (borderWidth > 0 && borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(x, y, w, h);
      }
    }
    
    // 轉換為 blob 並下載
    return new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('無法創建圖片 blob'));
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `border-grid-${this.settings.gridCountX}x${this.settings.gridCountY}-${this.settings.gridSize}px.jpg`;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log('[BorderGenerator] 備用方法導出成功:', filename);
        resolve();
      }, 'image/jpeg', 0.95);
    });
  }
}
