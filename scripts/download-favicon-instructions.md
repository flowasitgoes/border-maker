# 如何下载和集成 Flaticon Favicon

## 步骤 1: 下载 Favicon

1. 访问 https://www.flaticon.com/free-icons/favicon
2. 选择一个你喜欢的 favicon 图标
3. 点击下载，选择 **SVG** 格式（推荐）或 **PNG** 格式
4. 下载后，将文件保存到项目的 `src/public/` 文件夹

## 步骤 2: 重命名文件

将下载的文件重命名为 `icon.svg`（如果下载的是 SVG）或 `icon.png`（如果下载的是 PNG）

## 步骤 3: 运行图标生成脚本

下载完成后，运行以下命令生成所有尺寸的图标：

```bash
npm run generate:icons
```

或者：

```bash
pnpm generate:icons
```

这个脚本会：
- 从 `src/public/icon.svg` 生成各种尺寸的 favicon
- 生成 OG image（社交媒体分享图）
- 自动创建所有需要的图标文件

## 步骤 4: 验证

检查生成的文件：
```bash
ls -la src/public/*.png | grep -E "(favicon|apple|android|og)"
```

应该看到：
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png
- android-chrome-192x192.png
- android-chrome-512x512.png
- og-image.png

## 注意事项

- 如果下载的是 PNG 格式，需要先转换为 SVG，或者修改 `scripts/generate-icons.js` 来支持 PNG 源文件
- 确保图标是正方形（1:1 比例）
- 建议使用 SVG 格式，因为可以无损缩放

