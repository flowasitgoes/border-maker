import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 检测是否为 Vercel 环境
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    if (isVercel) {
      // Vercel 环境：不提供文件服务
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      )
    }

    // 本地环境：从文件系统读取文件
    const filename = params.path.join('/')
    const filePath = path.join(process.cwd(), 'src', 'public', 'uploads', filename)
    
    // 安全检查：确保路径在 uploads 目录内
    const uploadsDir = path.join(process.cwd(), 'src', 'public', 'uploads')
    const resolvedPath = path.resolve(filePath)
    const resolvedUploadsDir = path.resolve(uploadsDir)
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return NextResponse.json(
        { error: '无效的文件路径' },
        { status: 403 }
      )
    }

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      )
    }

    // 读取文件
    const fileBuffer = await readFile(filePath)
    
    // 根据文件扩展名设置 Content-Type
    const ext = path.extname(filename).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    }
    const contentType = contentTypeMap[ext] || 'application/octet-stream'

    // 返回文件
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    console.error('[API] 读取文件失败:', error)
    return NextResponse.json(
      { error: '读取文件失败', message: error.message },
      { status: 500 }
    )
  }
}

