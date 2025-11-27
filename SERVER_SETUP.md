# 服務器設置說明

## 統一服務器架構

本應用現在使用**單一端口統一服務器**，所有功能（前端應用、API、文件上傳）都在同一個端口運行。

## 安裝依賴

首先安裝依賴：

```bash
npm install
```

主要依賴包括：
- `express` - Web 服務器框架
- `multer` - 文件上傳中間件
- `cors` - 跨域支持

## 運行方式

### 開發模式（推薦）

```bash
npm run dev
```

這會：
1. 先構建 Angular 應用（輸出到 `www` 目錄）
2. 啟動統一服務器在 `http://localhost:3000`

**所有功能都在同一個端口：**
- 前端應用：`http://localhost:3000`
- API 端點：`http://localhost:3000/api/*`
- 上傳文件：`http://localhost:3000/uploads/*`

### 開發模式（監聽文件變化，自動重新構建）

```bash
npm run dev:watch
```

這會同時運行：
- Angular 構建監聽器（自動重新構建）
- 統一服務器

### 生產模式

```bash
npm run build:prod
npm run server
```

### 僅運行服務器（需要先構建）

```bash
npm run build
npm run server
```

## 文件存儲位置

上傳的圖片會保存在：
```
public/uploads/
```

服務器會自動創建這個文件夾（如果不存在）。

## API 端點

- `POST /api/upload` - 上傳圖片
- `GET /api/images` - 獲取所有上傳的圖片列表
- `DELETE /api/images/:filename` - 刪除圖片
- `GET /uploads/:filename` - 訪問上傳的圖片

## 目錄結構

```
border-maker/
├── server.js          # 統一服務器（Express）
├── public/            # 公共靜態文件
│   └── uploads/       # 上傳的圖片存儲位置
├── www/               # Angular 構建輸出（由 server.js 提供服務）
└── src/               # Angular 源代碼
```

## 注意事項

1. **文件大小限制**：單個文件最大 10MB
2. **文件類型**：只允許圖片文件（image/*）
3. **文件命名**：服務器會自動生成唯一文件名（時間戳 + 隨機數 + 擴展名），不包含原始文件名以避免中文檔名問題
4. **持久化存儲**：圖片保存在 `public/uploads/` 文件夾中，即使重啟服務器也不會丟失
5. **歷史記錄**：應用會從服務器加載所有已上傳的圖片，並在刷新頁面後自動恢復

## 生產環境部署

在生產環境中，請確保：
1. 修改 `src/environments/environment.prod.ts` 中的 `apiUrl` 為實際的服務器地址
2. 確保 `public/uploads/` 文件夾有寫入權限
3. 考慮使用環境變量來配置 API URL

