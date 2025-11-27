import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 检测是否为 Vercel 环境
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV

export async function GET() {
  try {
    if (isVercel) {
      // Vercel 环境：不读取文件系统，返回空数组
      console.log('[API] Vercel 环境：返回空图片列表')
      return NextResponse.json({
        success: true,
        images: []
      })
    }

    // 本地环境：从文件系统读取图片列表
    console.log('[API] 本地环境：从文件系统读取图片列表')
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    
    // 检查 uploads 文件夹是否存在
    if (!existsSync(uploadsDir)) {
      console.log('[API] uploads 文件夹不存在，返回空数组')
      return NextResponse.json({
        success: true,
        images: []
      })
    }

    // 读取文件夹中的所有文件
    const files = await readdir(uploadsDir)
    console.log('[API] 文件夹中的所有文件:', files)
    
    // 过滤出图片文件
    const imageFiles = files.filter(file => {
      // 忽略隐藏文件和系统文件
      if (file.startsWith('.')) {
        return false
      }
      const ext = path.extname(file).toLowerCase()
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
      console.log('[API] 文件:', file, '扩展名:', ext, '是图片:', isImage)
      return isImage
    })

    console.log('[API] 过滤后的图片文件:', imageFiles)

    // 构建图片信息数组
    const images = imageFiles.map(file => ({
      filename: file,
      path: `/uploads/${file}`,
      url: `/uploads/${file}` // 相对路径，Next.js 会自动处理
    }))

    console.log('[API] 返回图片列表，数量:', images.length)
    console.log('[API] 图片列表:', images)
    
    return NextResponse.json({
      success: true,
      images
    })
  } catch (error: any) {
    console.error('[API] 读取图片列表失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '读取图片列表失败', 
        message: error.message 
      },
      { status: 500 }
    )
  }
}

