import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageSquare, X, Send } from 'lucide-react';

export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, sendMessage, isLoading } = useChat();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (input.trim()) {
            sendMessage(input.trim());
            setInput('');
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-5 right-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 z-50"
                aria-label="Open chat"
            >
                <MessageSquare />
            </button>
        );
    }

    return (
        <div className="fixed bottom-5 right-5 w-96 h-[600px] bg-card border border-border rounded-xl shadow-2xl flex flex-col z-50">
            <header className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
                <h3 className="font-bold text-md text-foreground">AI Assistant</h3>
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close chat">
                    <X className="h-5 w-5"/>
                </button>
            </header>

            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                             <div className="max-w-xs px-4 py-2 rounded-2xl bg-secondary text-secondary-foreground rounded-bl-none">
                                <p className="text-sm animate-pulse">Thinking...</p>
                            </div>
                         </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-border flex-shrink-0">
                <div className="flex items-center bg-secondary rounded-lg pr-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Ask anything..."
                        className="w-full bg-transparent p-3 focus:outline-none text-sm"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input} className="text-primary disabled:text-muted-foreground p-2 rounded-full hover:bg-accent transition-colors">
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
