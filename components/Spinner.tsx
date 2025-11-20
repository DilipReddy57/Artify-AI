import React from 'react';
import { TextShimmer } from './ui/text-shimmer';
import { Sparkles } from 'lucide-react';

export const Spinner: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="z-10 flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-background/50 backdrop-blur-sm rounded-xl border border-border">
      <Sparkles className="h-8 w-8 text-primary animate-pulse" />
      <TextShimmer className='text-lg font-medium text-muted-foreground text-center' duration={2} children={message} />
    </div>
  );
};
