import { ImageIcon } from 'lucide-react'

interface PlaceholderImageProps {
  width?: number
  height?: number
  text?: string
  bgColor?: string
  textColor?: string
  className?: string
}

export function PlaceholderImage({ 
  width = 200, 
  height = 280, 
  text = 'Card Image', 
  bgColor = '#4f46e5',
  textColor = '#ffffff',
  className = ''
}: PlaceholderImageProps) {
  return (
    <div 
      className={`flex items-center justify-center text-white font-medium ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        backgroundColor: bgColor,
        color: textColor
      }}
    >
      <div className="text-center">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-80" />
        <span className="text-sm">{text}</span>
      </div>
    </div>
  )
}