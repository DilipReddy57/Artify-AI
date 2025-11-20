
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-border last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-5 text-left text-lg font-semibold text-foreground hover:bg-accent/50 transition-colors px-6"
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <ChevronDown className={`h-6 w-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-6 pt-0 text-muted-foreground">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Accordion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <div className="border border-border rounded-xl overflow-hidden">{children}</div>;
};
