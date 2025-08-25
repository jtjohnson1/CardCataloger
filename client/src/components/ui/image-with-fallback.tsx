import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string
  fallbackChildren?: React.ReactNode
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackChildren,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  console.log('ImageWithFallback - src:', src)
  console.log('ImageWithFallback - hasError:', hasError)
  console.log('ImageWithFallback - isLoading:', isLoading)

  const handleError = () => {
    console.log('ImageWithFallback - Image failed to load:', src)
    setHasError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    console.log('ImageWithFallback - Image loaded successfully:', src)
    setHasError(false)
    setIsLoading(false)
  }

  if (hasError) {
    console.log('ImageWithFallback - Showing fallback for:', src)
    return (
      <div className={cn('flex items-center justify-center bg-slate-100 dark:bg-slate-700', fallbackClassName)}>
        {fallbackChildren || (
          <div className="text-center p-4">
            <div className="text-slate-400 mb-2">📷</div>
            <div className="text-xs text-slate-500">Image not available</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(className, isLoading && 'opacity-50')}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  )
}