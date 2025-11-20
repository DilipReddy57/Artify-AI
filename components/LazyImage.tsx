import React, { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { cn } from '../lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (src) {
      setIsLoaded(false);
    }
  }, [src]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && src && (
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
        {...props}
      />
    </div>
  );
};
