import React from 'react';
import { Button } from './button';

export const CreatorCTA: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center bg-card border border-border rounded-2xl p-8 md:p-12 text-foreground">
            <h2 className="text-2xl md:text-3xl font-medium text-foreground">
                A Message from the Creator
            </h2>
            <p className="text-base text-muted-foreground mt-4 max-w-2xl">
                "I've spent countless hours in editing suites, chasing that perfect look. I built Artify AI for one simple reason: to give every creator the power to achieve professional, expert-level styles without the endless manual work. It's time to focus on your vision, not the sliders."
            </p>
            
            <div className='flex items-center gap-4 mt-8'>
                <a href="mailto:dilipkhanna5555@gmail.com">
                    <Button size="sm" className="px-4 py-2 text-xs">Contact Me</Button>
                </a>
            </div>
            <div className="mt-8 text-sm italic text-muted-foreground text-center">
                <p>Vibe Coded with Purpose and Confidence</p>
                <p>— Dilip Reddy, with Google AI Studio</p>
            </div>
        </div>
    );
};