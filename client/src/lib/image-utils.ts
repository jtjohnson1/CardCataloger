/**
 * Image utility functions for handling card images and placeholders
 */

export interface PlaceholderOptions {
  width?: number
  height?: number
  seed?: string
  text?: string
  backgroundColor?: string
  textColor?: string
}

/**
 * Generates a reliable SVG-based placeholder image
 * @param options Configuration options for the placeholder
 * @returns Base64 encoded SVG data URL
 */
export const generatePlaceholderImage = (options: PlaceholderOptions = {}): string => {
  const {
    width = 200,
    height = 280,
    seed = '',
    text = `Card ${seed}`,
    backgroundColor,
    textColor = 'white'
  } = options

  console.log('Generating placeholder image with options:', options)

  try {
    // Generate a deterministic color based on seed if no background color provided
    let bgColor = backgroundColor
    if (!bgColor) {
      const colors = ['4f46e5', '7c3aed', '2563eb', '059669', 'dc2626', 'ea580c', '8b5cf6', '06b6d4', 'f59e0b', 'ef4444']
      const colorIndex = seed ? seed.toString().charCodeAt(0) % colors.length : 0
      bgColor = colors[colorIndex]
    }

    // Remove # if present in color
    bgColor = bgColor.replace('#', '')

    // Calculate font size based on dimensions
    const fontSize = Math.max(12, Math.min(width, height) / 12)

    // Create SVG with proper escaping
    const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${bgColor}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="${textColor}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="500">${text}</text>
    </svg>`

    // Create base64 encoded data URL
    const base64Svg = btoa(unescape(encodeURIComponent(svgContent)))
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`

    console.log('Generated placeholder image - seed:', seed, 'size:', `${width}x${height}`, 'URL length:', dataUrl.length)
    
    return dataUrl
  } catch (error) {
    console.error('Error generating placeholder image:', error)
    
    // Fallback to a simple colored rectangle
    const fallbackSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6b7280"/></svg>`
    const fallbackBase64 = btoa(fallbackSvg)
    return `data:image/svg+xml;base64,${fallbackBase64}`
  }
}

/**
 * Validates if a string is a valid image URL or data URL
 * @param url The URL to validate
 * @returns True if the URL appears to be a valid image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    // Check for data URLs
    if (url.startsWith('data:image/')) {
      return true
    }

    // Check for HTTP/HTTPS URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Basic validation for common image extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
      const urlLower = url.toLowerCase()
      return imageExtensions.some(ext => urlLower.includes(ext)) || urlLower.includes('image')
    }

    // Check for relative paths
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
      const urlLower = url.toLowerCase()
      return imageExtensions.some(ext => urlLower.endsWith(ext))
    }

    return false
  } catch (error) {
    console.error('Error validating image URL:', error)
    return false
  }
}

/**
 * Creates a fallback image URL for when the primary image fails to load
 * @param originalUrl The original image URL that failed
 * @param options Options for generating the fallback
 * @returns A fallback image URL
 */
export const createFallbackImage = (originalUrl: string, options: PlaceholderOptions = {}): string => {
  console.log('Creating fallback image for failed URL:', originalUrl)
  
  // Extract some info from the original URL to make a more relevant placeholder
  let seed = options.seed || 'fallback'
  let text = options.text || 'Image Error'
  
  try {
    // Try to extract meaningful info from the URL
    if (originalUrl && typeof originalUrl === 'string') {
      const urlParts = originalUrl.split('/')
      const filename = urlParts[urlParts.length - 1]
      if (filename && filename.length > 0) {
        seed = filename.substring(0, 10) // Use first 10 chars of filename as seed
        text = 'No Image'
      }
    }
  } catch (error) {
    console.error('Error processing original URL for fallback:', error)
  }

  return generatePlaceholderImage({
    ...options,
    seed,
    text,
    backgroundColor: options.backgroundColor || 'dc2626' // Red background for errors
  })
}

/**
 * Preloads an image and returns a promise that resolves when loaded or rejects on error
 * @param url The image URL to preload
 * @returns Promise that resolves with the URL or rejects with error
 */
export const preloadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isValidImageUrl(url)) {
      reject(new Error('Invalid image URL'))
      return
    }

    const img = new Image()
    
    img.onload = () => {
      console.log('Image preloaded successfully:', url)
      resolve(url)
    }
    
    img.onerror = (error) => {
      console.error('Image preload failed:', url, error)
      reject(new Error(`Failed to load image: ${url}`))
    }
    
    img.src = url
  })
}

/**
 * Batch preloads multiple images
 * @param urls Array of image URLs to preload
 * @returns Promise that resolves with results for each URL
 */
export const preloadImages = async (urls: string[]): Promise<Array<{ url: string; success: boolean; error?: string }>> => {
  console.log('Batch preloading images:', urls.length)
  
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        await preloadImage(url)
        return { url, success: true }
      } catch (error) {
        return { 
          url, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        url: urls[index],
        success: false,
        error: result.reason?.message || 'Failed to preload'
      }
    }
  })
}

/**
 * Gets the optimal image dimensions while maintaining aspect ratio
 * @param originalWidth Original image width
 * @param originalHeight Original image height
 * @param maxWidth Maximum allowed width
 * @param maxHeight Maximum allowed height
 * @returns Optimal dimensions object
 */
export const getOptimalImageDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight
  
  let width = originalWidth
  let height = originalHeight
  
  // Scale down if too wide
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }
  
  // Scale down if too tall
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * Converts a file to a data URL
 * @param file The file to convert
 * @returns Promise that resolves with the data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }

    const reader = new FileReader()
    
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        console.log('File converted to data URL, size:', result.length)
        resolve(result)
      } else {
        reject(new Error('Failed to convert file to data URL'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error reading file'))
    }
    
    reader.readAsDataURL(file)
  })
}