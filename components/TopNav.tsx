import React from 'react';
import { Dock, DockItem } from '@/components/ui/dock';
import { Aperture, BotMessageSquare, Sparkles, Wand2, ClipboardList, Search } from 'lucide-react';
import type { View } from '../App';

interface TopNavProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const navItems = [
    { view: 'inspiration', label: 'Discover', icon: <Sparkles className='h-full w-full' /> },
    { view: 'analyze', label: 'Analyze', icon: <ClipboardList className='h-full w-full' /> },
    { view: 'research', label: 'Research', icon: <Search className='h-full w-full' /> },
    { view: 'style', label: 'Style Transfer', icon: <Aperture className='h-full w-full' /> },
    { view: 'generate', label: 'AI Generate', icon: <BotMessageSquare className='h-full w-full' /> },
    { view: 'edit', label: 'Magic Edit', icon: <Wand2 className='h-full w-full' /> },
];

export const TopNav: React.FC<TopNavProps> = ({ activeView, setActiveView }) => {
  return (
    <div className='relative w-full flex justify-center py-2 border-b border-border bg-background z-10'>
      <Dock>
        {navItems.map((item) => (
          <DockItem
            key={item.view}
            onClick={() => setActiveView(item.view as View)}
          >
            <div
              className={`flex items-center gap-2 px-4 h-10 rounded-md transition-colors duration-200 ${
                activeView === item.view
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
              title={item.label}
            >
              <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
            </div>
          </DockItem>
        ))}
      </Dock>
    </div>
  );
};