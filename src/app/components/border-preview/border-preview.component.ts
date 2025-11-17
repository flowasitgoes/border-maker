import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';

export interface BorderPreviewSettings {
  borderWidth: number;
  canvasWidth: number;
  canvasHeight: number;
  patternScale: number;
}

@Component({
  selector: 'app-border-preview',
  templateUrl: './border-preview.component.html',
  styleUrls: ['./border-preview.component.scss']
})
export class BorderPreviewComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() uploadedImage!: string;
  @Input() settings!: BorderPreviewSettings;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D | null;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d');
    this.drawBorder();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.canvas && this.ctx && (changes['uploadedImage'] || changes['settings'])) {
      this.drawBorder();
    }
  }

  private drawBorder(): void {
    if (!this.canvas || !this.ctx || !this.uploadedImage || !this.settings) {
      return;
    }

    // 設置 canvas 大小
    this.canvas.width = this.settings.canvasWidth;
    this.canvas.height = this.settings.canvasHeight;

    // 清空 canvas（透明背景）
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 加載上傳的圖片
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onerror = () => {
      console.error('圖片加載失敗');
    };
    
    img.onload = () => {
      if (!this.ctx) {
        return;
      }

      try {
        const borderWidth = this.settings.borderWidth;
        const innerWidth = this.canvas.width - borderWidth * 2;
        const innerHeight = this.canvas.height - borderWidth * 2;

        // 確保邊框不會比內容區域還大
        if (innerWidth <= 0 || innerHeight <= 0) {
          console.warn('邊框寬度過大，無法繪製');
          return;
        }

        const processedImage = this.removeBackground(img, this.settings.patternScale);

        const pattern = this.ctx.createPattern(processedImage, 'repeat');
        if (pattern && this.ctx) {
          this.ctx.fillStyle = pattern;
          
          // 上邊框
          this.ctx.fillRect(0, 0, this.canvas.width, borderWidth);
          // 下邊框
          this.ctx.fillRect(0, this.canvas.height - borderWidth, this.canvas.width, borderWidth);
          // 左邊框
          this.ctx.fillRect(0, 0, borderWidth, this.canvas.height);
          // 右邊框
          this.ctx.fillRect(this.canvas.width - borderWidth, 0, borderWidth, this.canvas.height);
        }
      } catch (error) {
        console.error('繪製邊框時發生錯誤:', error);
      }
    };
    img.src = this.uploadedImage;
  }

  private removeBackground(img: HTMLImageElement, patternScale: number): HTMLCanvasElement {
    const borderCanvas = document.createElement('canvas');
    borderCanvas.width = Math.ceil(img.width * patternScale);
    borderCanvas.height = Math.ceil(img.height * patternScale);
    const borderCtx = borderCanvas.getContext('2d');
    
    if (!borderCtx) {
      return borderCanvas;
    }

    // 繪製圖片
    borderCtx.drawImage(img, 0, 0, borderCanvas.width, borderCanvas.height);

    // 獲取圖片數據
    const imageData = borderCtx.getImageData(0, 0, borderCanvas.width, borderCanvas.height);
    const data = imageData.data;

    // 遍歷每個像素，移除白色和淺色背景
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // 檢測是否是白色或淺色像素（背景）
      // 如果 R、G、B 都很高（> 200），則視為背景
      if (r > 200 && g > 200 && b > 200) {
        data[i + 3] = 0; // 設置 alpha 為 0（透明）
      }
    }

    borderCtx.putImageData(imageData, 0, 0);
    return borderCanvas;
  }
}

