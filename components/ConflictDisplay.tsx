import React from 'react';
import { ConflictInfo } from '../types';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface ConflictDisplayProps {
    conflicts: ConflictInfo[];
}

const severityMap = {
    HIGH: { icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/20' },
    MEDIUM: { icon: Info, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
    LOW: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' }
};

export const ConflictDisplay: React.FC<ConflictDisplayProps> = ({ conflicts }) => {
    return (
        <div className="my-2">
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Compatibility Analysis</h4>
            <div className="space-y-3">
                {conflicts.map((conflict, index) => {
                    const { icon: Icon, color, bgColor, borderColor } = severityMap[conflict.severity];
                    return (
                        <div key={index} className={`p-3 rounded-lg border ${bgColor} ${borderColor}`}>
                            <div className="flex items-center gap-3">
                                <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
                                <div>
                                    <p className={`font-bold text-sm ${color}`}>
                                        {conflict.severity} Severity: {conflict.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    </p>
                                    <p className="text-xs text-foreground/80">{conflict.description}</p>
                                </div>
                            </div>
                             <div className="mt-2 pl-8 text-xs">
                                <p className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
                                    <span className="font-bold">Approach:</span> The AI will adapt by focusing on the "{conflict.approach.replace(/_/g, ' ')}" strategy.
                                </p>
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};