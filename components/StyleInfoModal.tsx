
import React from 'react';
import { X } from 'lucide-react';
import type { IdentifiedStyle } from '../types';
import { getStyleDescription } from '../services/styleKnowledge';

interface StyleInfoModalProps {
  style: IdentifiedStyle | null;
  onClose: () => void;
}

export const StyleInfoModal: React.FC<StyleInfoModalProps> = ({ style, onClose }) => {
  if (!style) return null;

  const description = getStyleDescription(style.style);

  return (
    <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors"
          aria-label="Close style details"
        >
          <X />
        </button>

        <h2 className="text-2xl font-bold text-foreground">{style.style}</h2>
        <p className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full inline-block mt-1">{style.category}</p>

        <div className="mt-4 text-muted-foreground space-y-4">
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
};
