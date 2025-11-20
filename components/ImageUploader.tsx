import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { LazyImage } from './LazyImage';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
  disabled?: boolean;
  disabledText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageUrl, disabled = false, disabledText }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(isEntering);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  return (
      <div
        onClick={handleClick}
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative w-full h-full p-4 border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-300 ${
          disabled ? 'cursor-not-allowed bg-secondary/50 opacity-50' : 'cursor-pointer hover:border-primary hover:bg-accent'
        } ${isDragging ? 'border-primary bg-accent' : 'border-border'}`}
        role="button"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          disabled={disabled}
        />
        {imageUrl ? (
          <LazyImage src={imageUrl} alt="preview" className="object-contain h-full w-full rounded-lg p-1" />
        ) : (
          <div className="text-center text-muted-foreground text-xs pointer-events-none">
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
             {disabled ? (
                <p>{disabledText || 'This uploader is currently disabled.'}</p>
            ) : (
                <>
                    <p>Drag & drop your image here or</p>
                    <p className="font-semibold text-primary">click to browse</p>
                </>
            )}
          </div>
        )}
      </div>
  );
};