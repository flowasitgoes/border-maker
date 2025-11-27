// Vercel Serverless Function for getting image list
// 尝试读取构建输出中的静态文件

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: '只允许 GET 请求' 
    });
  }

  try {
    console.log('[API/images] 开始获取图片列表');
    console.log('[API/images] 当前工作目录:', process.cwd());
    console.log('[API/images] __dirname:', __dirname);
    
    // 尝试多个可能的路径
    const possiblePaths = [
      path.join(process.cwd(), 'www', 'uploads'),  // Vercel 构建输出
      path.join(process.cwd(), 'uploads'),         // 根目录
      path.join(__dirname, '..', 'www', 'uploads'), // 相对路径
      path.join(__dirname, '..', 'public', 'uploads'), // public 目录
      path.join(__dirname, '..', 'src', 'public', 'uploads'), // src/public
    ];

    console.log('[API/images] 尝试的路径列表:', possiblePaths);

    let uploadsDir = null;
    for (const dirPath of possiblePaths) {
      console.log('[API/images] 检查路径:', dirPath);
      try {
        if (fs.existsSync(dirPath)) {
          console.log('[API/images] 找到目录:', dirPath);
          uploadsDir = dirPath;
          break;
        } else {
          console.log('[API/images] 路径不存在:', dirPath);
        }
      } catch (err) {
        console.log('[API/images] 检查路径时出错:', dirPath, err.message);
      }
    }

    if (!uploadsDir) {
      console.log('[API/images] 未找到 uploads 目录，返回空数组');
      console.log('[API/images] 注意：在 Vercel 上，静态文件可能无法通过文件系统访问');
      return res.status(200).json({
        success: true,
        images: [],
        debug: {
          message: '未找到 uploads 目录',
          checkedPaths: possiblePaths,
          cwd: process.cwd(),
          dirname: __dirname
        }
      });
    }

    console.log('[API/images] 使用目录:', uploadsDir);
    
    // 读取目录中的文件
    const files = fs.readdirSync(uploadsDir);
    console.log('[API/images] 目录中的所有文件:', files);
    
    // 过滤出图片文件
    const imageFiles = files.filter(file => {
      // 忽略隐藏文件
      if (file.startsWith('.')) {
        console.log('[API/images] 忽略隐藏文件:', file);
        return false;
      }
      const ext = path.extname(file).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      console.log('[API/images] 文件:', file, '扩展名:', ext, '是图片:', isImage);
      return isImage;
    });

    console.log('[API/images] 过滤后的图片文件:', imageFiles);
    console.log('[API/images] 图片数量:', imageFiles.length);

    // 构建图片信息数组
    // 在 Vercel 上，静态文件应该通过 /uploads/ 路径访问
    const images = imageFiles.map(file => ({
      filename: file,
      path: `/uploads/${file}`,
      url: `/uploads/${file}`
    }));

    console.log('[API/images] 返回图片列表，数量:', images.length);
    console.log('[API/images] 图片列表:', JSON.stringify(images, null, 2));
    
    return res.status(200).json({
      success: true,
      images: images,
      debug: {
        uploadsDir: uploadsDir,
        totalFiles: files.length,
        imageFiles: imageFiles.length
      }
    });
  } catch (error) {
    console.error('[API/images] 读取图片列表失败:', error);
    console.error('[API/images] 错误堆栈:', error.stack);
    return res.status(500).json({
      success: false,
      error: '读取图片列表失败',
      message: error.message,
      debug: {
        cwd: process.cwd(),
        dirname: __dirname,
        stack: error.stack
      }
    });
  }
};

