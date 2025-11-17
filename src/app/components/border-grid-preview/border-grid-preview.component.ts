import { Component, Input } from '@angular/core';
import { BorderSettings } from '../../services/border.service';

@Component({
  selector: 'app-border-grid-preview',
  templateUrl: './border-grid-preview.component.html',
  styleUrls: ['./border-grid-preview.component.scss']
})
export class BorderGridPreviewComponent {
  @Input() uploadedImage!: string;
  @Input() settings!: BorderSettings;

  get gridCells(): number[] {
    const total = this.settings.gridCountX * this.settings.gridCountY;
    return Array.from({ length: total }, (_, i) => i);
  }

  isBorderCell(index: number): boolean {
    const row = Math.floor(index / this.settings.gridCountX);
    const col = index % this.settings.gridCountX;
    return (
      row === 0 ||
      row === this.settings.gridCountY - 1 ||
      col === 0 ||
      col === this.settings.gridCountX - 1
    );
  }

  getGridStyle(): { [key: string]: string } {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${this.settings.gridCountX}, ${this.settings.gridSize}px)`,
      gap: '2px',
      padding: '2px'
    };
  }

  getCellStyle(index: number): { [key: string]: string } {
    const isBorder = this.isBorderCell(index);
    const isReversed = this.settings.isReversed || false;
    // 如果反轉：邊框顯示圖片，中心不顯示；如果不反轉：中心顯示圖片，邊框不顯示
    const shouldShowImage = isReversed ? isBorder : !isBorder;
    
    return {
      width: `${this.settings.gridSize}px`,
      height: `${this.settings.gridSize}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: shouldShowImage ? `url(${this.uploadedImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }
}

