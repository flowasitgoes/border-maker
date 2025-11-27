import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 检测是否为 Vercel 环境
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: '没有上传文件', message: '请检查文件大小（最大10MB）和文件类型（只允许图片）' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '只允许上传图片文件' },
        { status: 400 }
      )
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件太大', message: '文件大小不能超过 10MB' },
        { status: 400 }
      )
    }

    // 将文件转换为 Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomSuffix = Math.round(Math.random() * 1E9)
    const ext = path.extname(file.name).toLowerCase() || '.jpg'
    const filename = `${timestamp}-${randomSuffix}${ext}`

    let filePath: string | null = null
    let imageDataUrl: string | null = null

    if (isVercel) {
      // Vercel 环境：不保存文件，只返回 base64
      console.log('[API] Vercel 环境：不保存文件，仅返回 base64')
      const base64 = buffer.toString('base64')
      imageDataUrl = `data:${file.type};base64,${base64}`
      
      return NextResponse.json({
        success: true,
        filePath: null, // Vercel 环境不保存文件
        filename: filename,
        imageDataUrl: imageDataUrl, // 返回 base64 数据
        isVercel: true
      })
    } else {
      // 本地环境：保存文件到本地文件夹
      console.log('[API] 本地环境：保存文件到本地文件夹')
      
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      
      // 确保 uploads 文件夹存在
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
        console.log('[API] 创建 uploads 文件夹:', uploadsDir)
      }

      // 保存文件
      const fullPath = path.join(uploadsDir, filename)
      await writeFile(fullPath, buffer)
      console.log('[API] 文件已保存到:', fullPath)

      // 验证文件是否真的存在
      if (!existsSync(fullPath)) {
        console.error('[API] 错误: 文件保存失败，文件不存在:', fullPath)
        return NextResponse.json(
          { error: '文件保存失败' },
          { status: 500 }
        )
      }

      // 返回文件路径（相对于 public 文件夹）
      filePath = `/uploads/${filename}`
      
      // 同时生成 base64 用于前端渲染
      imageDataUrl = `data:${file.type};base64,${buffer.toString('base64')}`

      return NextResponse.json({
        success: true,
        filePath: filePath,
        filename: filename,
        imageDataUrl: imageDataUrl, // 也返回 base64 用于渲染
        isVercel: false
      })
    }
  } catch (error: any) {
    console.error('[API] 上传文件时发生错误:', error)
    return NextResponse.json(
      { error: '上传失败', message: error.message || '未知错误' },
      { status: 500 }
    )
  }
}

