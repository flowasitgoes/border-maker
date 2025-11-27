'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import BorderGridPreview from './border-grid-preview'

interface BorderSettings {
  borderWidth: number
  gridCountX: number
  gridCountY: number
  gridSize: number
}

export default function BorderGenerator() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<BorderSettings>({
    borderWidth: 40,
    gridCountX: 8,
    gridCountY: 5,
    gridSize: 60,
  })

  // 在组件初始化时加载已有图片
  useEffect(() => {
    const loadImagesFromServer = async () => {
      try {
        console.log('[BorderGenerator] 开始从服务器加载图片列表')
        const response = await fetch('/api/images')
        
        if (!response.ok) {
          console.warn('[BorderGenerator] 无法从服务器加载图片列表')
          return
        }

        const data = await response.json()
        console.log('[BorderGenerator] 从服务器收到响应:', data)

        if (data.success && data.images && data.images.length > 0) {
          console.log('[BorderGenerator] 服务器图片数量:', data.images.length)
          
          // 将服务器上的图片路径添加到 Gallery
          const serverImagePaths = data.images.map((img: any) => img.path || img.url)
          console.log('[BorderGenerator] 服务器图片路径:', serverImagePaths)
          
          // 合并服务器图片和当前 Gallery（避免重复）
          setGalleryImages((prev) => {
            const merged = [...new Set([...serverImagePaths, ...prev])]
            console.log('[BorderGenerator] 合并后的 Gallery 数量:', merged.length)
            return merged
          })
        } else {
          console.log('[BorderGenerator] 服务器没有图片或响应失败')
        }
      } catch (error) {
        console.warn('[BorderGenerator] 无法从服务器加载图片列表，错误:', error)
      }
    }

    loadImagesFromServer()
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleImageUpload = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      console.error('错误: 不是图片文件')
      return
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      console.error('错误: 文件太大', file.size, 'bytes')
      return
    }

    setIsUploading(true)

    try {
      // 调用 API 上传文件
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '上传失败')
      }

      const data = await response.json()

      if (data.success) {
        // 本地环境：优先使用文件路径，Vercel 环境：使用 base64
        const displayImage = data.filePath || data.imageDataUrl
        const galleryImage = data.filePath || data.imageDataUrl // 本地环境用路径，Vercel 用 base64
        
        if (displayImage) {
          setUploadedImage(displayImage)
          // 將新上傳的圖片添加到Gallery（避免重複）
          setGalleryImages((prev) => {
            if (!prev.includes(galleryImage)) {
              return [galleryImage, ...prev]
            }
            return prev
          })

          // 如果是本地环境，文件已保存到 public/uploads/
          if (data.filePath && !data.isVercel) {
            console.log('文件已保存到本地:', data.filePath)
          } else if (data.isVercel) {
            console.log('Vercel 环境: 文件仅用于渲染，未保存到文件系统')
          }
        }
      }
    } catch (error) {
      console.error('上传图片失败:', error)
      // 如果上传失败，回退到 base64 方式（仅用于渲染，不保存）
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        setUploadedImage(imageDataUrl)
        setGalleryImages((prev) => {
          if (!prev.includes(imageDataUrl)) {
            return [imageDataUrl, ...prev]
          }
          return prev
        })
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const updateSetting = (key: keyof BorderSettings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleGalleryImageClick = (imageDataUrl: string) => {
    setUploadedImage(imageDataUrl)
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="h-80 bg-gradient-to-b from-emerald-300 to-emerald-200 border-b-4 border-orange-500 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {!uploadedImage ? (
            // Upload Area
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all h-full flex items-center justify-center ${
                isDragging
                  ? 'border-orange-600 bg-orange-100'
                  : 'border-orange-400 bg-emerald-100'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {isUploading ? '正在上傳中...' : '拖放圖片到此或點擊上傳'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            // Settings Panel
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Grid Count X */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    寬度網格數: {settings.gridCountX}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="1"
                    value={settings.gridCountX}
                    onChange={(e) => updateSetting('gridCountX', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                </div>

                {/* Grid Count Y */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    高度網格數: {settings.gridCountY}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="1"
                    value={settings.gridCountY}
                    onChange={(e) => updateSetting('gridCountY', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                </div>

                {/* Grid Size */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    網格大小: {settings.gridSize}px
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={settings.gridSize}
                    onChange={(e) => updateSetting('gridSize', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex gap-2 justify-start">
                <Button
                  onClick={() => setUploadedImage(null)}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1"
                >
                  重新上傳
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area - Left Image + Right Grid */}
      {uploadedImage && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 bg-blue-300 border-r-4 border-orange-500 flex items-center justify-center p-4 overflow-auto">
            <img
              src={uploadedImage || "/placeholder.svg"}
              alt="Uploaded"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="w-1/2 bg-pink-200 border-r-4 border-orange-500 flex items-center justify-center p-4 overflow-auto">
            <BorderGridPreview uploadedImage={uploadedImage} settings={settings} />
          </div>
        </div>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <div className="bg-slate-800 border-t-4 border-orange-500 p-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg font-bold text-white mb-3">Gallery</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {galleryImages.map((imageUrl, index) => (
                <div
                  key={index}
                  onClick={() => handleGalleryImageClick(imageUrl)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                    uploadedImage === imageUrl
                      ? 'border-orange-500 ring-2 ring-orange-300'
                      : 'border-slate-600 hover:border-orange-400'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
