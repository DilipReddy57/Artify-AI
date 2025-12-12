import { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { startChat, sendMessage as sendChatMessage } from '../services/geminiService';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);

    useEffect(() => {
        // Initialize the chat session when the hook is first used
        try {
            chatRef.current = startChat();
            setMessages([{ role: 'model', text: 'Hello! How can I help you today?' }]);
        } catch (e) {
            console.warn("Failed to initialize chat:", e);
            setMessages([{ role: 'model', text: 'Chat functionality is currently unavailable (API Key missing).' }]);
        }
    }, []);

    const sendMessage = async (messageText: string) => {
        if (!chatRef.current) {
            setMessages(prev => [...prev, { role: 'user', text: messageText }, { role: 'model', text: 'Chat is not available.' }]);
            return;
        }

        setIsLoading(true);
        // Add user message to the history immediately
        setMessages(prev => [...prev, { role: 'user', text: messageText }]);

        try {
            const responseText = await sendChatMessage(chatRef.current, messageText);
            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            console.error("Chat error:", error);
            const isRateLimitError = String(error).includes('429') || String(error).includes('RESOURCE_EXHAUSTED');
            const errorMessage = isRateLimitError
                ? "I've hit my usage limit for now. Please try again in a little bit."
                : "Sorry, I encountered an error. Please try again.";
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    return { messages, sendMessage, isLoading };
};
