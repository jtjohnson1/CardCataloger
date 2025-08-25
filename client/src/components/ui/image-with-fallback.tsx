import React, { useState, useEffect } from 'react';
import { PlaceholderImage } from './placeholder-image';

interface ImageWithFallbackProps {
  src?: string;
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
  fallbackText,
  width = 200,
  height = 280
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset error state when src changes
  useEffect(() => {
    if (src) {
      setHasError(false);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    console.log('ImageWithFallback - Image failed to load:', src);
    setIsLoading(false);
    setHasError(true);
  };

  // Show fallback if no src, has error, or still loading
  if (!src || hasError || isLoading) {
    const displayText = fallbackText || alt || 'No Image';
    return (
      <PlaceholderImage
        width={width}
        height={height}
        text={displayText}
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
        width: width,
        height: height,
        objectFit: 'cover'
      }}
    />
  );
}