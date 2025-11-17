'use client'

import { useEffect, useRef, forwardRef } from 'react'

interface BorderSettings {
  borderWidth: number
  canvasWidth: number
  canvasHeight: number
  patternScale: number
}

interface BorderPreviewProps {
  uploadedImage: string
  settings: BorderSettings
}

const BorderPreview = forwardRef<HTMLCanvasElement, BorderPreviewProps>(
  ({ uploadedImage, settings }, ref) => {
    const internalRef = useRef<HTMLCanvasElement>(null)
    const canvasRef = (ref as any) || internalRef

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 設置 canvas 大小
      canvas.width = settings.canvasWidth
      canvas.height = settings.canvasHeight

      // 清空 canvas（透明背景）
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 加載上傳的圖片
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const borderWidth = settings.borderWidth
        const innerWidth = canvas.width - borderWidth * 2
        const innerHeight = canvas.height - borderWidth * 2

        // 確保邊框不會比內容區域還大
        if (innerWidth <= 0 || innerHeight <= 0) return

        const processedImage = removeBackground(img, settings.patternScale)

        const pattern = ctx.createPattern(processedImage, 'repeat')
        if (pattern) {
          ctx.fillStyle = pattern
          
          // 上邊框
          ctx.fillRect(0, 0, canvas.width, borderWidth)
          // 下邊框
          ctx.fillRect(0, canvas.height - borderWidth, canvas.width, borderWidth)
          // 左邊框
          ctx.fillRect(0, 0, borderWidth, canvas.height)
          // 右邊框
          ctx.fillRect(canvas.width - borderWidth, 0, borderWidth, canvas.height)
        }
      }
      img.src = uploadedImage
    }, [uploadedImage, settings, canvasRef])

    const removeBackground = (img: HTMLImageElement, patternScale: number): HTMLCanvasElement => {
      const borderCanvas = document.createElement('canvas')
      borderCanvas.width = Math.ceil(img.width * patternScale)
      borderCanvas.height = Math.ceil(img.height * patternScale)
      const borderCtx = borderCanvas.getContext('2d')
      
      if (!borderCtx) return borderCanvas

      // 繪製圖片
      borderCtx.drawImage(img, 0, 0, borderCanvas.width, borderCanvas.height)

      // 獲取圖片數據
      const imageData = borderCtx.getImageData(0, 0, borderCanvas.width, borderCanvas.height)
      const data = imageData.data

      // 遍歷每個像素，移除白色和淺色背景
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]

        // 檢測是否是白色或淺色像素（背景）
        // 如果 R、G、B 都很高（> 200），則視為背景
        if (r > 200 && g > 200 && b > 200) {
          data[i + 3] = 0 // 設置 alpha 為 0（透明）
        }
      }

      borderCtx.putImageData(imageData, 0, 0)
      return borderCanvas
    }

    return (
      <canvas
        ref={canvasRef}
        className="border border-slate-300 dark:border-slate-600 rounded-lg shadow-md"
      />
    )
  }
)

BorderPreview.displayName = 'BorderPreview'

export default BorderPreview
