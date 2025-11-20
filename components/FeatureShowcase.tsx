import React from 'react';
import { cn } from '../lib/utils';

interface FeatureShowcaseProps {
    title: string;
    description: string;
    children: React.ReactNode;
    align?: 'left' | 'right';
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
    title,
    description,
    children,
    align = 'left'
}) => {
    return (
        <section className="py-16 md:py-24 px-4 md:px-8 bg-background even:bg-card/50">
            <div className="container mx-auto max-w-6xl">
                <div className={cn(
                    "flex flex-col lg:flex-row gap-8 md:gap-16 items-center",
                    align === 'right' && 'lg:flex-row-reverse'
                )}>
                    <div className="lg:w-1/2">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h2>
                        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
                    </div>
                    <div className="lg:w-1/2 w-full aspect-video bg-black/20 rounded-xl overflow-hidden border border-border shadow-lg flex items-center justify-center">
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
};
