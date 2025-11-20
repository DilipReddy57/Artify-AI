import React from 'react';
import { Download, X } from 'lucide-react';
import { LazyImage } from './LazyImage';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
  onDownload?: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, onDownload }) => {
  if (!imageUrl) return null;

  return (
    <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div className="absolute top-4 right-4 flex gap-3">
        {onDownload && (
            <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="text-foreground hover:text-primary transition-colors"
                aria-label="Download image"
            >
                <Download />
            </button>
        )}
        <button
          onClick={onClose}
          className="text-foreground hover:text-primary transition-colors"
          aria-label="Close image viewer"
        >
          <X />
        </button>
      </div>

      <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        <LazyImage src={imageUrl} alt="Fullscreen view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
      </div>
    </div>
  );
};