'use client'

import { useState, useRef } from 'react'
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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<BorderSettings>({
    borderWidth: 40,
    gridCountX: 8,
    gridCountY: 5,
    gridSize: 60,
  })

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

  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
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
                  拖放圖片到此或點擊上傳
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
                {/* Border Width */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    邊框寬度: {settings.borderWidth}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={settings.borderWidth}
                    onChange={(e) => updateSetting('borderWidth', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                </div>

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
    </div>
  )
}
