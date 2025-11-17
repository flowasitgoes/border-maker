import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit, AfterViewInit {
  @Input() initialColor: string = '#f9a8d4';
  @Output() colorChange = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('spectrumCanvas', { static: false }) spectrumCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hueCanvas', { static: false }) hueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('spectrumCursor', { static: false }) spectrumCursor!: ElementRef<HTMLElement>;
  @ViewChild('hueCursor', { static: false }) hueCursor!: ElementRef<HTMLElement>;

  currentColor: string = '#f9a8d4';
  hexValue: string = '#f9a8d4';
  hue: number = 0;
  saturation: number = 1;
  lightness: number = 0.5;
  value: number = 1; // HSV 的 Value

  private spectrumCtx!: CanvasRenderingContext2D;
  private hueCtx!: CanvasRenderingContext2D;
  private isDraggingSpectrum = false;
  private isDraggingHue = false;
  private spectrumRect!: DOMRect;
  private hueRect!: DOMRect;

  // 背景色选项
  backgroundOptions = [
    { value: '#ffc9c9', label: '浅粉', color: '#ffc9c9' },
    { value: '#ffec99', label: '浅黄', color: '#ffec99' },
    { value: '#a4d8ff', label: '浅蓝', color: '#a4d8ff' },
    { value: '#d0bfff', label: '浅紫', color: '#d0bfff' },
    { value: '#b1f2bc', label: '浅绿', color: '#b1f2bc' },
    { value: '#52bad4', label: '藍綠', color: '#52bad4' }
  ];

  // 填充图案选项
  fillPatterns = [
    { value: 'solid', label: '实心' },
    { value: 'diagonal', label: '斜线' },
    { value: 'dots', label: '点状' }
  ];

  selectedBackground: string = '#ffc9c9';
  selectedFillPattern: string = 'solid';

  ngOnInit(): void {
    this.currentColor = this.initialColor;
    this.hexValue = this.initialColor;
    this.colorToHsl(this.initialColor);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCanvases();
      if (this.initialColor) {
        this.updateColorFromHex(this.initialColor);
      }
    }, 0);
  }

  initCanvases(): void {
    if (this.spectrumCanvas && this.hueCanvas) {
      this.spectrumCtx = this.spectrumCanvas.nativeElement.getContext('2d')!;
      this.hueCtx = this.hueCanvas.nativeElement.getContext('2d')!;
      this.createHueSpectrum();
      this.createShadeSpectrum();
      this.updateCursors();
    }
  }

  createHueSpectrum(): void {
    const canvas = this.hueCanvas.nativeElement;
    const ctx = this.hueCtx;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    gradient.addColorStop(0.00, 'hsl(0,100%,50%)');
    gradient.addColorStop(0.17, 'hsl(298.8, 100%, 50%)');
    gradient.addColorStop(0.33, 'hsl(241.2, 100%, 50%)');
    gradient.addColorStop(0.50, 'hsl(180, 100%, 50%)');
    gradient.addColorStop(0.67, 'hsl(118.8, 100%, 50%)');
    gradient.addColorStop(0.83, 'hsl(61.2,100%,50%)');
    gradient.addColorStop(1.00, 'hsl(360,100%,50%)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  createShadeSpectrum(): void {
    const canvas = this.spectrumCanvas.nativeElement;
    const ctx = this.spectrumCtx;
    const hueColor = `hsl(${this.hue}, 100%, 50%)`;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = hueColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 白色渐变（从左到右）
    const whiteGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    whiteGradient.addColorStop(0, '#fff');
    whiteGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = whiteGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 黑色渐变（从上到下）
    const blackGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    blackGradient.addColorStop(0, 'transparent');
    blackGradient.addColorStop(1, '#000');
    ctx.fillStyle = blackGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  colorToHsl(color: string): void {
    const rgb = this.hexToRgb(color);
    if (!rgb) return;
    
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
    this.hue = hsl.h;
    this.saturation = hsv.s; // 使用 HSV 的 saturation
    this.lightness = hsl.l;
    this.value = hsv.v;
  }

  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h: h * 360, s, l };
  }

  hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h / 360 + 1/3);
      g = hue2rgb(p, q, h / 360);
      b = hue2rgb(p, q, h / 360 - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h = 0;
    if (d !== 0) {
      if (max === r) {
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / d + 2) / 6;
      } else {
        h = ((r - g) / d + 4) / 6;
      }
    }
    
    const s = max === 0 ? 0 : d / max;
    const v = max;
    
    return { h: h * 360, s, v };
  }

  hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    h /= 360;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    let r, g, b;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
      default: r = v; g = t; b = p;
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  updateColorFromHex(hex: string): void {
    this.hexValue = hex;
    this.colorToHsl(hex);
    this.currentColor = hex;
    this.createShadeSpectrum();
    this.updateCursors();
    this.colorChange.emit(hex);
  }

  updateCursors(): void {
    if (!this.spectrumCanvas || !this.hueCanvas) return;
    
    this.spectrumRect = this.spectrumCanvas.nativeElement.getBoundingClientRect();
    this.hueRect = this.hueCanvas.nativeElement.getBoundingClientRect();
    
    // 更新色相游标位置
    const hueY = this.hueRect.height - ((this.hue / 360) * this.hueRect.height);
    if (this.hueCursor && this.hueCursor.nativeElement) {
      this.hueCursor.nativeElement.style.top = hueY + 'px';
      const hueColor = `hsl(${this.hue}, 100%, 50%)`;
      this.hueCursor.nativeElement.style.backgroundColor = hueColor;
    }
    
    // 更新光谱游标位置（使用 HSV）
    // 从当前颜色获取 HSV 值
    const rgb = this.hexToRgb(this.currentColor);
    if (rgb) {
      const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
      const x = this.spectrumRect.width * hsv.s;
      const y = this.spectrumRect.height * (1 - hsv.v);
      if (this.spectrumCursor && this.spectrumCursor.nativeElement) {
        this.spectrumCursor.nativeElement.style.left = x + 'px';
        this.spectrumCursor.nativeElement.style.top = y + 'px';
        this.spectrumCursor.nativeElement.style.backgroundColor = this.currentColor;
      }
    }
  }

  onSpectrumMouseDown(event: MouseEvent): void {
    this.isDraggingSpectrum = true;
    this.getSpectrumColor(event);
    window.addEventListener('mousemove', this.onSpectrumMouseMove);
    window.addEventListener('mouseup', this.onSpectrumMouseUp);
  }

  onSpectrumMouseMove = (event: MouseEvent): void => {
    if (this.isDraggingSpectrum) {
      this.getSpectrumColor(event);
    }
  };

  onSpectrumMouseUp = (): void => {
    this.isDraggingSpectrum = false;
    window.removeEventListener('mousemove', this.onSpectrumMouseMove);
    window.removeEventListener('mouseup', this.onSpectrumMouseUp);
  };

  getSpectrumColor(event: MouseEvent): void {
    if (!this.spectrumRect) {
      this.spectrumRect = this.spectrumCanvas.nativeElement.getBoundingClientRect();
    }
    
    let x = event.clientX - this.spectrumRect.left;
    let y = event.clientY - this.spectrumRect.top;
    
    // 限制坐标在 canvas 边界内
    x = Math.max(0, Math.min(this.spectrumRect.width, x));
    y = Math.max(0, Math.min(this.spectrumRect.height, y));
    
    const xRatio = x / this.spectrumRect.width;
    const yRatio = y / this.spectrumRect.height;
    
    // 使用 HSV 颜色空间：x = saturation, y = value (从上到下，value 从 1 到 0)
    const hsvSaturation = xRatio;
    const hsvValue = 1 - yRatio;
    
    // 将 HSV 转换为 RGB
    const rgb = this.hsvToRgb(this.hue, hsvSaturation, hsvValue);
    this.currentColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    this.hexValue = this.currentColor;
    
    // 更新 HSV 和 HSL 值
    this.saturation = hsvSaturation; // HSV 的 saturation
    this.value = hsvValue; // HSV 的 value
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    this.lightness = hsl.l; // HSL 的 lightness（用于兼容性）
    
    if (this.spectrumCursor && this.spectrumCursor.nativeElement) {
      this.spectrumCursor.nativeElement.style.left = x + 'px';
      this.spectrumCursor.nativeElement.style.top = y + 'px';
      this.spectrumCursor.nativeElement.style.backgroundColor = this.currentColor;
    }
    
    this.colorChange.emit(this.currentColor);
  }

  onHueMouseDown(event: MouseEvent): void {
    this.isDraggingHue = true;
    this.getHueColor(event);
    window.addEventListener('mousemove', this.onHueMouseMove);
    window.addEventListener('mouseup', this.onHueMouseUp);
  }

  onHueMouseMove = (event: MouseEvent): void => {
    if (this.isDraggingHue) {
      this.getHueColor(event);
    }
  };

  onHueMouseUp = (): void => {
    this.isDraggingHue = false;
    window.removeEventListener('mousemove', this.onHueMouseMove);
    window.removeEventListener('mouseup', this.onHueMouseUp);
  };

  getHueColor(event: MouseEvent): void {
    if (!this.hueRect) {
      this.hueRect = this.hueCanvas.nativeElement.getBoundingClientRect();
    }
    
    let y = event.clientY - this.hueRect.top;
    
    // 限制坐标在 canvas 边界内
    y = Math.max(0, Math.min(this.hueRect.height, y));
    
    const percent = y / this.hueRect.height;
    
    this.hue = 360 - (360 * percent);
    this.createShadeSpectrum();
    
    // 使用当前的 HSV 值来保持饱和度和亮度（this.saturation 和 this.value 都是 HSV 值）
    const rgb = this.hsvToRgb(this.hue, this.saturation, this.value);
    this.currentColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    this.hexValue = this.currentColor;
    
    // 更新 HSL 值（用于兼容性，但不覆盖 HSV 的 saturation）
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    this.lightness = hsl.l;
    
    if (this.hueCursor && this.hueCursor.nativeElement) {
      this.hueCursor.nativeElement.style.top = y + 'px';
      const hueColor = `hsl(${this.hue}, 100%, 50%)`;
      this.hueCursor.nativeElement.style.backgroundColor = hueColor;
    }
    
    this.colorChange.emit(this.currentColor);
  }

  onHexChange(): void {
    if (/^#[0-9A-F]{6}$/i.test(this.hexValue)) {
      this.updateColorFromHex(this.hexValue);
    }
  }

  onBackgroundSelect(value: string): void {
    this.selectedBackground = value;
    // 更新当前选择的颜色
    this.updateColorFromHex(value);
  }

  onFillPatternSelect(value: string): void {
    this.selectedFillPattern = value;
  }

  onClose(): void {
    this.close.emit();
  }
}

