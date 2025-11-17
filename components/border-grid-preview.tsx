'use client'

interface BorderSettings {
  borderWidth: number
  gridCountX: number
  gridCountY: number
  gridSize: number
}

interface BorderGridPreviewProps {
  uploadedImage: string
  settings: BorderSettings
}

export default function BorderGridPreview({
  uploadedImage,
  settings,
}: BorderGridPreviewProps) {
  const { borderWidth, gridCountX, gridCountY, gridSize } = settings

  // Calculate center area dimensions
  const centerWidth = gridSize * (gridCountX - 2)
  const centerHeight = gridSize * (gridCountY - 2)

  return (
    <div
      className="relative bg-white"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCountX}, ${gridSize}px)`,
        gap: '2px',
        padding: '2px',
      }}
    >
      {Array.from({ length: gridCountX * gridCountY }).map((_, index) => {
        const row = Math.floor(index / gridCountX)
        const col = index % gridCountX

        // Check if this grid cell is part of the border or center
        const isBorder =
          row === 0 ||
          row === gridCountY - 1 ||
          col === 0 ||
          col === gridCountX - 1

        return (
          <div
            key={index}
            className={`border-2 ${
              isBorder
                ? 'bg-pink-300 border-orange-600'
                : 'bg-blue-300 border-yellow-400'
            }`}
            style={{
              width: `${gridSize}px`,
              height: `${gridSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Center area shows the image
              backgroundImage: !isBorder
                ? `url(${uploadedImage})`
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )
      })}
    </div>
  )
}
