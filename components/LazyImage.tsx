import React, { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { cn } from '../lib/utils';
import { AlertCircle } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src) {
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src]);

  const handleError = () => {
      setIsLoaded(true);
      setHasError(true);
  };

  if (hasError) {
      return (
          <div className={cn("relative w-full h-full flex flex-col items-center justify-center bg-secondary/20 rounded-md p-4 text-muted-foreground", className)}>
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs text-center">Failed to load image</span>
          </div>
      );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && src && !hasError && (
        <Skeleton className="absolute top-0 left-0 w-full h-full" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          'transition-opacity duration-500 ease-in-out',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        {...props}
      />
    </div>
  );
};
