# 平台配置指南

本指南說明如何為不同平台配置和構建 Border Maker 應用。

## iOS 配置

### 前置要求
- macOS 系統
- Xcode 14+ 
- CocoaPods (`sudo gem install cocoapods`)

### 設置步驟

1. **添加 iOS 平台**
```bash
npm run cap:add ios
```

2. **同步代碼到 iOS 專案**
```bash
npm run cap:sync
```

3. **打開 Xcode**
```bash
npm run cap:open ios
```

4. **在 Xcode 中配置**
   - 選擇專案目標
   - 在 "Signing & Capabilities" 中設置開發團隊
   - 配置 Bundle Identifier（預設：`com.bordermaker.app`）
   - 設置最低 iOS 版本（建議 iOS 13+）

5. **構建和運行**
   - 在 Xcode 中選擇目標設備或模擬器
   - 點擊運行按鈕

### iOS 權限配置

在 `ios/App/App/Info.plist` 中添加必要的權限說明：

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>需要訪問相冊以選擇圖片</string>
<key>NSCameraUsageDescription</key>
<string>需要訪問相機以拍攝圖片</string>
```

## Android 配置

### 前置要求
- Android Studio 最新版本
- JDK 11+
- Android SDK

### 設置步驟

1. **添加 Android 平台**
```bash
npm run cap:add android
```

2. **同步代碼到 Android 專案**
```bash
npm run cap:sync
```

3. **打開 Android Studio**
```bash
npm run cap:open android
```

4. **在 Android Studio 中配置**
   - 等待 Gradle 同步完成
   - 設置最低 SDK 版本（建議 API 21+）
   - 配置應用簽名（用於發布）

5. **構建和運行**
   - 連接 Android 設備或啟動模擬器
   - 點擊運行按鈕

### Android 權限配置

在 `android/app/src/main/AndroidManifest.xml` 中添加權限：

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

## Web 配置

### 開發模式

```bash
npm start
```

應用將在 `http://localhost:4200` 運行

### 生產構建

```bash
npm run build:prod
```

構建輸出在 `www/` 目錄，可以部署到任何靜態網站託管服務。

### PWA 配置

應用已配置為 PWA（Progressive Web App），支援：
- 離線訪問
- 添加到主屏幕
- 響應式設計

## 平台特定功能

### 圖片選擇

- **Web**: 使用標準 HTML file input
- **iOS/Android**: 可以使用 Capacitor Camera 或 Filesystem 插件

### 響應式設計

應用已配置響應式設計：
- 移動設備：垂直佈局
- 桌面設備：水平佈局（768px+）

## 常見問題

### iOS 構建錯誤

如果遇到 CocoaPods 相關錯誤：
```bash
cd ios/App
pod install
cd ../..
```

### Android 構建錯誤

確保 Android SDK 和構建工具已正確安裝：
```bash
# 在 Android Studio 中檢查 SDK Manager
```

### Web 構建錯誤

確保所有依賴已安裝：
```bash
npm install
```

## 發布

### iOS App Store

1. 在 Xcode 中選擇 "Product" > "Archive"
2. 上傳到 App Store Connect
3. 在 App Store Connect 中提交審核

### Google Play Store

1. 在 Android Studio 中生成簽名 APK/AAB
2. 上傳到 Google Play Console
3. 提交審核

### Web 部署

將 `www/` 目錄部署到：
- Netlify
- Vercel
- GitHub Pages
- 任何靜態網站託管服務

