import React, { useState } from 'react';
import { Aperture, BotMessageSquare, Star, Wand2, ClipboardList, Search, Pencil, Paintbrush, PenTool, Menu, X } from 'lucide-react';
import type { View } from '../App';
import { Dock, DockItem } from './ui/dock';

const navItems = [
    { view: 'inspiration', label: 'Discover', icon: <Star className='h-full w-full' /> },
    { view: 'analyze', label: 'Analyze', icon: <ClipboardList className='h-full w-full' /> },
    { view: 'research', label: 'Research', icon: <Search className='h-full w-full' /> },
    { view: 'style', label: 'Style Transfer', icon: <Aperture className='h-full w-full' /> },
    { view: 'generate', label: 'AI Generate', icon: <BotMessageSquare className='h-full w-full' /> },
    { view: 'edit', label: 'Magic Edit', icon: <Wand2 className='h-full w-full' /> },
];

export const Header: React.FC<{ activeView: View, setActiveView: (view: View) => void }> = ({ activeView, setActiveView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="relative bg-background border-b border-border px-4 flex items-center h-16 flex-shrink-0 z-20">
      <div className="flex items-center justify-between w-full">
        {/* Logo and Brand Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-4">
            {/* Crayon/Highlighter -> PenTool */}
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center z-10 border-2 border-background">
              <PenTool className="w-4 h-4 text-red-500 transform -rotate-30" />
            </div>
            {/* Paintbrush */}
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center z-20 border-2 border-background">
              <Paintbrush className="w-5 h-5 text-amber-500" />
            </div>
            {/* Pencil */}
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center z-10 border-2 border-background">
              <Pencil className="w-4 h-4 text-cyan-500 transform rotate-30" />
            </div>
          </div>
          <span className="text-xl font-bold">Artify AI</span>
        </div>
        
        {/* Desktop Navigation Dock */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Dock distance={60} magnification={1.1} panelHeight={48}>
            {navItems.map((item) => (
              <DockItem
                key={item.view}
                onClick={() => setActiveView(item.view as View)}
              >
                <div
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg transition-colors duration-200 ${
                    activeView === item.view
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  }`}
                  title={item.label}
                >
                  <div className="w-4 h-4 flex-shrink-0">{item.icon}</div>
                  <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                </div>
              </DockItem>
            ))}
          </Dock>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md hover:bg-accent"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
            >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-card border-b border-border shadow-lg md:hidden">
              <nav className="flex flex-col p-4 gap-2">
                  {navItems.map((item) => (
                      <button
                          key={item.view}
                          onClick={() => {
                              setActiveView(item.view as View);
                              setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                              activeView === item.view ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                          }`}
                      >
                          <div className="w-5 h-5">{item.icon}</div>
                          <span className="font-medium">{item.label}</span>
                      </button>
                  ))}
              </nav>
          </div>
      )}
    </header>
  );
};