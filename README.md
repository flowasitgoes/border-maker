# Border Maker - Ionic Angular 版本

這是一個使用 Ionic + Angular 開發的邊框生成器應用，支援多平台部署：
- iOS Mobile APP
- Android Mobile APP
- Desktop Web
- Mobile Web

## 專案結構

```
border-maker/
├── src/
│   ├── app/
│   │   ├── components/          # Angular 組件
│   │   │   ├── border-generator/
│   │   │   ├── border-grid-preview/
│   │   │   └── border-preview/
│   │   ├── home/                # 主頁面
│   │   ├── services/            # Angular 服務
│   │   │   └── border.service.ts
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── theme/                   # 主題樣式
│   │   └── variables.scss
│   ├── global.scss              # 全局樣式
│   ├── index.html
│   └── main.ts
├── angular.json                 # Angular 配置
├── capacitor.config.ts          # Capacitor 配置
├── ionic.config.json            # Ionic 配置
└── package.json
```

## 安裝與運行

### 安裝依賴

```bash
npm install
# 或
pnpm install
```

### 開發模式

```bash
npm start
# 或
ionic serve
```

應用將在 `http://localhost:4200` 運行

### 構建 Web 版本

```bash
npm run build
```

構建輸出將在 `www/` 目錄

### 構建生產版本

```bash
npm run build:prod
```

## 平台部署

### iOS

1. 添加 iOS 平台：
```bash
npm run cap:add ios
```

2. 同步代碼：
```bash
npm run cap:sync
```

3. 打開 Xcode：
```bash
npm run cap:open ios
```

4. 在 Xcode 中構建和運行

### Android

1. 添加 Android 平台：
```bash
npm run cap:add android
```

2. 同步代碼：
```bash
npm run cap:sync
```

3. 打開 Android Studio：
```bash
npm run cap:open android
```

4. 在 Android Studio 中構建和運行

## 功能特性

- 圖片上傳（拖放或點擊）
- 可調整參數：
  - 邊框寬度
  - 網格數量（寬度/高度）
  - 網格大小
- 實時預覽
- 響應式設計（支援桌面和移動設備）

## 技術棧

- **框架**: Ionic 8 + Angular 18
- **語言**: TypeScript
- **狀態管理**: RxJS (BehaviorSubject)
- **跨平台**: Capacitor 6
- **樣式**: SCSS + Ionic 組件

## 從 Next.js 遷移

此專案已從 Next.js + React 遷移到 Ionic + Angular。主要變更：

- React Hooks → Angular Services + RxJS
- JSX → Angular 模板語法
- Next.js 路由 → Angular Router
- Tailwind CSS → 自定義 SCSS + Ionic 組件

## 開發說明

- 組件位於 `src/app/components/`
- 服務位於 `src/app/services/`
- 樣式使用 SCSS，支援響應式設計
- 使用 Ionic 組件庫構建 UI

## 許可證

MIT
