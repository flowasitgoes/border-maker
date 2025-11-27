import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadResponse {
  success: boolean;
  filePath: string | null;
  filename: string;
  imageDataUrl?: string; // Vercel 环境返回 base64
  isVercel?: boolean; // 标识是否为 Vercel 环境
}

export interface ImageListResponse {
  success: boolean;
  images: Array<{
    filename: string;
    path: string;
    url: string;
  }>;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  filename: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = environment.apiUrl;
  // 使用相對路徑，在 Vercel 上會自動使用當前域名
  private serverUrl = environment.production ? '' : 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<UploadResponse> {
    console.log('[UploadService] 開始上傳圖片');
    console.log('[UploadService] 文件名:', file.name);
    console.log('[UploadService] 文件大小:', file.size, 'bytes');
    console.log('[UploadService] 文件類型:', file.type);
    console.log('[UploadService] API URL:', `${this.apiUrl}/upload`);

    const formData = new FormData();
    formData.append('image', file);

    console.log('[UploadService] FormData 已創建，發送請求...');
    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  getImageList(): Observable<ImageListResponse> {
    console.log('[UploadService] 獲取圖片列表');
    console.log('[UploadService] API URL:', `${this.apiUrl}/images`);
    return this.http.get<ImageListResponse>(`${this.apiUrl}/images`);
  }

  deleteImage(filePath: string): Observable<DeleteResponse> {
    console.log('[UploadService] 開始刪除圖片');
    console.log('[UploadService] 圖片路徑:', filePath);
    
    // 從路徑中提取文件名
    let filename = '';
    if (filePath.startsWith('/uploads/')) {
      filename = filePath.replace('/uploads/', '');
    } else if (filePath.startsWith('uploads/')) {
      filename = filePath.replace('uploads/', '');
    } else if (filePath.includes('/uploads/')) {
      filename = filePath.split('/uploads/')[1];
    } else {
      // 如果已經是文件名，直接使用
      filename = filePath;
    }
    
    console.log('[UploadService] 提取的文件名:', filename);
    console.log('[UploadService] 刪除 API URL:', `${this.apiUrl}/images/${filename}`);
    
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/images/${filename}`);
  }

  getImageUrl(filePath: string): string {
    console.log('[UploadService] 轉換圖片路徑:', filePath);
    // 如果已經是完整 URL，直接返回
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      console.log('[UploadService] 已是完整 URL，直接返回');
      return filePath;
    }
    // 如果是相對路徑，加上服務器 URL
    const fullUrl = `${this.serverUrl}${filePath}`;
    console.log('[UploadService] 完整 URL:', fullUrl);
    return fullUrl;
  }
}

