
import React from 'react';

interface ColorPaletteProps {
  palette: string[] | null;
  title: string;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ palette, title }) => {
  if (!palette || palette.length === 0) return null;

  return (
    <div className="my-2">
      <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">{title}</h4>
      <div className="flex gap-2 flex-wrap">
        {palette.map((color, index) => (
          <div key={index} className="flex items-center gap-2 bg-accent p-1.5 rounded-md border border-border">
            <div
              className="w-5 h-5 rounded-sm border border-border"
              style={{ backgroundColor: color }}
              aria-label={color}
              title={color}
            />
            <span className="text-xs font-mono text-muted-foreground">{color.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
