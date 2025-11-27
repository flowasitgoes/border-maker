const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 啟用 CORS
app.use(cors());

// 解析 JSON
app.use(express.json());

// 確保 uploads 文件夾存在
const uploadsDir = path.join(__dirname, 'src', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置 multer 用於文件上傳
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：只使用時間戳，避免中文檔名問題
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'; // 確保有擴展名
    // 統一使用時間戳作為文件名，格式：timestamp-randomSuffix.ext
    cb(null, `${timestamp}-${randomSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log('[Server] Multer fileFilter 檢查文件:', {
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    // 只允許圖片文件
    if (file.mimetype.startsWith('image/')) {
      console.log('[Server] 文件類型驗證通過');
      cb(null, true);
    } else {
      console.error('[Server] 文件類型驗證失敗:', file.mimetype);
      cb(new Error('只允許上傳圖片文件'), false);
    }
  }
});

// 上傳圖片 API
app.post('/api/upload', (req, res, next) => {
  console.log('[Server] 收到上傳請求');
  console.log('[Server] 請求方法:', req.method);
  console.log('[Server] 請求 URL:', req.url);
  console.log('[Server] 請求頭 Content-Type:', req.headers['content-type']);
  console.log('[Server] 請求頭 Content-Length:', req.headers['content-length']);
  next();
}, upload.single('image'), (req, res) => {
  console.log('[Server] Multer 處理完成');
  console.log('[Server] 請求體:', req.body);
  console.log('[Server] 文件對象:', req.file);

  if (!req.file) {
    console.error('[Server] 錯誤: 沒有上傳文件');
    console.error('[Server] 可能的原因: 1) 文件太大 2) 文件類型不允許 3) 字段名不匹配');
    return res.status(400).json({ 
      error: '沒有上傳文件',
      message: '請檢查文件大小（最大10MB）和文件類型（只允許圖片）'
    });
  }

  console.log('[Server] 文件信息:', {
    originalname: req.file.originalname,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  });

  // 驗證文件是否真的存在
  if (!fs.existsSync(req.file.path)) {
    console.error('[Server] 錯誤: 文件保存失敗，文件不存在:', req.file.path);
    return res.status(500).json({ error: '文件保存失敗' });
  }

  // 返回文件路徑（相對於 public 文件夾）
  const filePath = `/uploads/${req.file.filename}`;
  const response = {
    success: true,
    filePath: filePath,
    filename: req.file.filename
  };
  
  console.log('[Server] 返回響應:', response);
  res.json(response);
}, (err, req, res, next) => {
  // Multer 錯誤處理
  console.error('[Server] Multer 錯誤:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      console.error('[Server] 文件太大');
      return res.status(400).json({ error: '文件太大', message: '文件大小不能超過 10MB' });
    }
    console.error('[Server] Multer 錯誤代碼:', err.code);
    return res.status(400).json({ error: '上傳失敗', message: err.message });
  }
  if (err) {
    console.error('[Server] 其他錯誤:', err.message);
    return res.status(400).json({ error: '上傳失敗', message: err.message });
  }
  next();
});

// 刪除圖片 API
app.delete('/api/images/:filename', (req, res) => {
  console.log('[Server] 收到刪除圖片請求');
  const filename = req.params.filename;
  console.log('[Server] 要刪除的文件名:', filename);
  
  try {
    // 構建完整文件路徑
    const filePath = path.join(uploadsDir, filename);
    console.log('[Server] 文件完整路徑:', filePath);
    
    // 檢查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('[Server] 文件不存在:', filePath);
      return res.status(404).json({ error: '文件不存在', filename });
    }
    
    // 刪除文件
    fs.unlinkSync(filePath);
    console.log('[Server] 文件已刪除:', filePath);
    
    res.json({ 
      success: true, 
      message: '文件刪除成功',
      filename: filename
    });
  } catch (error) {
    console.error('[Server] 刪除文件失敗:', error);
    res.status(500).json({ 
      error: '刪除文件失敗', 
      message: error.message 
    });
  }
});

// 獲取所有上傳的圖片列表
app.get('/api/images', (req, res) => {
  console.log('[Server] 收到獲取圖片列表請求');
  try {
    console.log('[Server] 讀取文件夾:', uploadsDir);
    const files = fs.readdirSync(uploadsDir);
    console.log('[Server] 文件夾中的所有文件:', files);
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      console.log('[Server] 文件:', file, '擴展名:', ext, '是圖片:', isImage);
      return isImage;
    });

    console.log('[Server] 過濾後的圖片文件:', imageFiles);

    const images = imageFiles.map(file => ({
      filename: file,
      path: `/uploads/${file}`,
      url: `http://localhost:${PORT}/uploads/${file}`
    }));

    console.log('[Server] 返回圖片列表，數量:', images.length);
    console.log('[Server] 圖片列表:', images);
    res.json({ success: true, images });
  } catch (error) {
    console.error('[Server] 讀取圖片列表失敗:', error);
    res.status(500).json({ error: '讀取圖片列表失敗', message: error.message });
  }
});

// 提供靜態文件服務（讓前端可以訪問上傳的圖片）
app.use('/uploads', express.static(uploadsDir));

// 提供 public 文件夾的靜態文件服務
app.use(express.static(path.join(__dirname, 'src', 'public')));

// 啟動服務器
app.listen(PORT, () => {
  console.log(`[Server] 服務器運行在 http://localhost:${PORT}`);
  console.log(`[Server] 上傳文件夾: ${uploadsDir}`);
  console.log(`[Server] 上傳文件夾是否存在:`, fs.existsSync(uploadsDir));
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log(`[Server] 上傳文件夾中的文件數量:`, files.length);
    console.log(`[Server] 上傳文件夾中的文件:`, files);
  }
});

