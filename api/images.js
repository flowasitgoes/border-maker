// Vercel Serverless Function for getting image list
// 注意：Vercel 文件系统是只读的，所以返回空数组

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
    // Vercel 环境：不读取文件系统，返回空数组
    console.log('[API] Vercel 环境：返回空图片列表');
    return res.status(200).json({
      success: true,
      images: []
    });
  } catch (error) {
    console.error('[API] 读取图片列表失败:', error);
    return res.status(500).json({
      success: false,
      error: '读取图片列表失败',
      message: error.message
    });
  }
};

