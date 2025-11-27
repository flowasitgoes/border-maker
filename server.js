const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中間件配置 ====================
// 啟用 CORS
app.use(cors());

// 解析 JSON 和 URL 編碼
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== 路徑配置 ====================
// 統一使用 public/uploads 路徑
const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(publicDir, 'uploads');

// 確保目錄存在
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==================== Multer 配置 ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：時間戳-隨機數.擴展名
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${timestamp}-${randomSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允許圖片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片文件'), false);
    }
  }
});

// ==================== API 路由 ====================

// POST /api/upload - 上傳圖片
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: '沒有上傳文件',
        message: '請檢查文件大小（最大10MB）和文件類型（只允許圖片）'
      });
    }

    // 驗證文件是否真的存在
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({ 
        success: false,
        error: '文件保存失敗' 
      });
    }

    // 生成 base64 用於前端渲染（可選）
    const fileBuffer = fs.readFileSync(req.file.path);
    const imageDataUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;

    // 返回文件信息
    const filePath = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      filePath: filePath,
      filename: req.file.filename,
      imageDataUrl: imageDataUrl
    });
  } catch (error) {
    console.error('[API] 上傳錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '上傳失敗', 
      message: error.message 
    });
  }
});

// Multer 錯誤處理中間件
app.use('/api/upload', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        error: '文件太大', 
        message: '文件大小不能超過 10MB' 
      });
    }
    return res.status(400).json({ 
      success: false,
      error: '上傳失敗', 
      message: err.message 
    });
  }
  if (err) {
    return res.status(400).json({ 
      success: false,
      error: '上傳失敗', 
      message: err.message 
    });
  }
  next();
});

// GET /api/images - 獲取所有圖片列表
app.get('/api/images', (req, res) => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ success: true, images: [] });
    }

    const files = fs.readdirSync(uploadsDir);
    
    // 過濾出圖片文件
    const imageFiles = files.filter(file => {
      // 忽略隱藏文件
      if (file.startsWith('.')) {
        return false;
      }
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    // 構建圖片信息
    const images = imageFiles.map(file => ({
      filename: file,
      path: `/uploads/${file}`,
      url: `/uploads/${file}`
    }));

    res.json({ success: true, images });
  } catch (error) {
    console.error('[API] 讀取圖片列表失敗:', error);
    res.status(500).json({ 
      success: false,
      error: '讀取圖片列表失敗', 
      message: error.message 
    });
  }
});

// DELETE /api/images/:filename - 刪除圖片
app.delete('/api/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // 安全檢查：確保文件名不包含路徑分隔符
    if (filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        success: false,
        error: '無效的文件名' 
      });
    }

    const filePath = path.join(uploadsDir, filename);
    
    // 檢查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        error: '文件不存在', 
        filename 
      });
    }
    
    // 刪除文件
    fs.unlinkSync(filePath);
    
    res.json({ 
      success: true, 
      message: '文件刪除成功',
      filename: filename
    });
  } catch (error) {
    console.error('[API] 刪除文件失敗:', error);
    res.status(500).json({ 
      success: false,
      error: '刪除文件失敗', 
      message: error.message 
    });
  }
});

// GET /uploads/* - 提供上傳文件的靜態服務
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // 設置緩存頭
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// ==================== 靜態文件服務 ====================
// 提供 public 文件夾的靜態文件服務（用於上傳的文件等）
app.use(express.static(publicDir));

// 提供 Angular 構建輸出的靜態文件服務（www 目錄）
const wwwDir = path.join(__dirname, 'www');
if (fs.existsSync(wwwDir)) {
  app.use(express.static(wwwDir));
}

// Angular 路由支持：所有非 API 路由都返回 index.html（用於 Angular Router）
// 注意：這個路由必須放在最後，讓靜態文件優先匹配
app.get('*', (req, res, next) => {
  // 跳過 API 路由和上傳文件路由
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  // 如果請求的是文件（有擴展名），讓 Express 靜態文件中間件處理
  if (req.path.includes('.')) {
    return next();
  }
  
  // 對於 Angular 路由（無擴展名的路徑），返回 index.html
  const indexHtml = path.join(wwwDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Angular 應用未構建，請先運行 npm run build');
  }
});

// ==================== 啟動服務器 ====================
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 統一服務器運行在 http://localhost:${PORT}`);
  console.log(`📁 上傳文件夾: ${uploadsDir}`);
  console.log(`📂 Public 文件夾: ${publicDir}`);
  console.log(`🌐 Angular 應用: ${wwwDir}`);
  console.log('='.repeat(50));
  console.log('📡 API 端點:');
  console.log('   POST   /api/upload        - 上傳圖片');
  console.log('   GET    /api/images        - 獲取圖片列表');
  console.log('   DELETE /api/images/:name  - 刪除圖片');
  console.log('='.repeat(50));
  
  // 檢查 Angular 構建是否存在
  if (!fs.existsSync(wwwDir)) {
    console.log('⚠️  警告: Angular 應用未構建，請先運行 npm run build');
  }
  
  // 顯示現有文件數量
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => {
      if (file.startsWith('.')) return false;
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    console.log(`📸 現有圖片數量: ${imageFiles.length}`);
  }
});

