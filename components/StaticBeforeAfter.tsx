import React from 'react';
import { LazyImage } from './LazyImage';

interface StaticBeforeAfterProps {
    beforeSrc: string;
    afterSrc: string;
}

export const StaticBeforeAfter: React.FC<StaticBeforeAfterProps> = ({ beforeSrc, afterSrc }) => {
    return (
        <div className="grid grid-cols-2 h-full w-full">
            <div className="relative border-r border-border/20">
                <LazyImage src={beforeSrc} alt="Before" className="object-cover w-full h-full" />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Before</div>
            </div>
            <div className="relative">
                <LazyImage src={afterSrc} alt="After" className="object-cover w-full h-full" />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">After</div>
            </div>
        </div>
    );
};
