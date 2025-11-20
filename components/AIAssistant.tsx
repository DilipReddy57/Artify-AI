import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

interface AIAssistantProps {
    onSendMessage: (prompt: string) => void;
    isLoading: boolean;
    placeholder?: string;
    label?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
    onSendMessage, 
    isLoading, 
    placeholder = "What adjustments would you like to make?",
    label = "AI Assistant"
}) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const handleClear = () => {
        setInput('');
    }

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor="refine-prompt" className="font-semibold text-sm text-foreground">{label}</label>
            <div className="relative">
                <input
                    id="refine-prompt"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                    placeholder={placeholder}
                    className="w-full bg-input border border-border rounded-md p-2 pl-3 pr-20 text-sm focus:ring-2 focus:ring-ring focus:outline-none transition"
                    disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    {input && !isLoading && (
                        <button onClick={handleClear} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Clear input">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <div className="h-5 w-px bg-border mx-1.5" />
                    <button onClick={handleSend} disabled={isLoading || !input} className="text-primary disabled:text-muted-foreground p-1 rounded-full hover:bg-accent transition-colors" aria-label="Send prompt">
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};