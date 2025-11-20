
import React from 'react';

interface ErrorDisplayProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="bg-destructive/20 border border-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm flex justify-between items-center">
      <span>{message}</span>
      <button onClick={onDismiss} className="font-bold text-lg leading-none" aria-label="Dismiss error">&times;</button>
    </div>
  );
};
