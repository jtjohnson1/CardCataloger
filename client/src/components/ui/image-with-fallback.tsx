import React, { useState } from 'react';
import { PlaceholderImage } from './placeholder-image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  width?: number;
  height?: number;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className = '', 
  fallbackText = 'Image', 
  width = 200, 
  height = 280 
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  console.log('ImageWithFallback - src:', src);
  console.log('ImageWithFallback - hasError:', hasError);
  console.log('ImageWithFallback - isLoading:', isLoading);

  const handleError = () => {
    console.log('ImageWithFallback - Image failed to load:', src);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log('ImageWithFallback - Image loaded successfully:', src);
    setIsLoading(false);
    setHasError(false);
  };

  if (!src || hasError) {
    console.log('ImageWithFallback - Showing fallback for:', src);
    return (
      <PlaceholderImage
        width={width}
        height={height}
        text={fallbackText}
        className={className}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      style={{ 
        display: isLoading ? 'none' : 'block',
        width: width,
        height: height,
        objectFit: 'cover'
      }}
    />
  );
}