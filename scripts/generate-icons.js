const fs = require('fs');
const path = require('path');

// 检查是否安装了 sharp
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('错误: 需要安装 sharp 库');
  console.log('请运行: npm install --save-dev sharp');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'src', 'public');
const sourceIcon = path.join(publicDir, 'icon.svg');

// 需要生成的图标尺寸
const iconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

// OG Image (社交媒体分享图片) 尺寸
const ogImageSize = { width: 1200, height: 630 };

async function generateIcons() {
  console.log('开始生成图标...');
  
  // 检查源文件是否存在
  if (!fs.existsSync(sourceIcon)) {
    console.error(`错误: 源图标文件不存在: ${sourceIcon}`);
    process.exit(1);
  }

  // 生成各种尺寸的 favicon
  for (const { size, name } of iconSizes) {
    try {
      const outputPath = path.join(publicDir, name);
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ 生成 ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ 生成 ${name} 失败:`, error.message);
    }
  }

  // 生成 OG Image (thumbnail)
  try {
    const ogImagePath = path.join(publicDir, 'og-image.png');
    
    // 创建一个简单的 OG 图片
    // 使用 SVG 作为基础，然后添加文字
    const svgBuffer = Buffer.from(`
      <svg width="${ogImageSize.width}" height="${ogImageSize.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <rect x="60" y="60" width="1080" height="510" rx="40" fill="white" opacity="0.95"/>
        <text x="600" y="280" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#1f2937" text-anchor="middle">
          Border Generator
        </text>
        <text x="600" y="360" font-family="Arial, sans-serif" font-size="40" fill="#6b7280" text-anchor="middle">
          为你的图片添加精美的边框
        </text>
        <g transform="translate(600, 450)">
          <rect x="-100" y="-30" width="200" height="60" rx="30" fill="#f97316"/>
          <text x="0" y="10" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">
            开始使用
          </text>
        </g>
      </svg>
    `);

    await sharp(svgBuffer)
      .png()
      .toFile(ogImagePath);
    console.log(`✓ 生成 og-image.png (${ogImageSize.width}x${ogImageSize.height})`);
  } catch (error) {
    console.error(`✗ 生成 OG Image 失败:`, error.message);
  }

  // 生成 favicon.ico (多尺寸 ICO 文件)
  try {
    const faviconPath = path.join(publicDir, 'favicon.ico');
    // 使用 32x32 作为 favicon.ico
    await sharp(sourceIcon)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    
    // 注意: sharp 不支持直接生成 .ico 文件
    // 可以使用 png 作为 favicon，或者使用其他工具转换
    console.log('✓ 生成 favicon (使用 PNG 格式)');
    console.log('  提示: 如需 .ico 格式，可以使用在线工具转换 favicon-32x32.png');
  } catch (error) {
    console.error(`✗ 生成 favicon 失败:`, error.message);
  }

  console.log('\n图标生成完成！');
  console.log('\n生成的文件:');
  iconSizes.forEach(({ name }) => {
    console.log(`  - ${name}`);
  });
  console.log('  - og-image.png');
  console.log('\n请更新 app/layout.tsx 中的 metadata 配置以使用这些图标。');
}

generateIcons().catch(console.error);

