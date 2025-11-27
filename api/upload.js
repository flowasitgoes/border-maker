// Vercel Serverless Function for file upload
// 注意：Vercel 文件系统是只读的，所以只返回 base64，不保存文件

const multer = require('multer');
const { Readable } = require('stream');

// 配置 multer 使用内存存储
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: '只允许 POST 请求' 
    });
  }

  // 使用 multer 处理文件上传
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: '文件太大',
            message: '文件大小不能超过 10MB'
          });
        }
      }
      return res.status(400).json({
        success: false,
        error: '上传失败',
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: '没有上传文件',
          message: '请检查文件大小（最大10MB）和文件类型（只允许图片）'
        });
      }

      // 生成唯一文件名
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const ext = req.file.originalname ? 
        req.file.originalname.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
      const filename = `${timestamp}-${randomSuffix}.${ext}`;

      // Vercel 环境：不保存文件，只返回 base64
      const base64 = req.file.buffer.toString('base64');
      const imageDataUrl = `data:${req.file.mimetype};base64,${base64}`;

      return res.status(200).json({
        success: true,
        filePath: null, // Vercel 环境不保存文件
        filename: filename,
        imageDataUrl: imageDataUrl, // 返回 base64 数据
        isVercel: true
      });
    } catch (error) {
      console.error('[API] 上传文件时发生错误:', error);
      return res.status(500).json({
        success: false,
        error: '上传失败',
        message: error.message || '未知错误'
      });
    }
  });
};

