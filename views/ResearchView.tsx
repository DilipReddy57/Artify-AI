
import React, { useState } from 'react';
import { groundedSearch } from '../services/geminiService';
import { Spinner } from '../components/Spinner';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { GroundedSearchResult } from '../types';
import { Link } from 'lucide-react';
import { AIInputWithLoading } from '../components/ui/ai-input-with-loading';
import { Button } from '../components/ui/button';


const examplePrompts = [
    "What are the latest trends in portrait photography for 2024?",
    "Compare Lightroom vs Capture One for professional photo editing.",
    "Explain the 'teal and orange' cinematic color grading style.",
    "Who were the most influential street photographers of the 20th century?",
    "What is the 'Rule of Thirds' in photo composition?",
    "How to create a 'light and airy' photo editing style?"
];


const renderLine = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc pl-6 my-2 space-y-1">
                    {listItems}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        if (line.startsWith('# ')) {
            flushList();
            elements.push(<h2 key={index} className="text-2xl font-bold mt-4 mb-2">{renderLine(line.substring(2))}</h2>);
            return;
        }
        if (line.startsWith('## ')) {
            flushList();
            elements.push(<h3 key={index} className="text-xl font-bold mt-3 mb-1">{renderLine(line.substring(3))}</h3>);
            return;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
            const content = line.substring(2);
            listItems.push(<li key={index}>{renderLine(content)}</li>);
            return;
        }

        flushList();
        if (line.trim() !== '') {
            elements.push(<p key={index} className="my-2">{renderLine(line)}</p>);
        }
    });

    flushList(); // Flush any remaining list items
    return <>{elements}</>;
};

export const ResearchView: React.FC = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<GroundedSearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (currentQuery: string) => {
        if (!currentQuery) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const searchResult = await groundedSearch(currentQuery);
            setResult(searchResult);
        } catch (e) {
            console.error(e);
            const isRateLimitError = String(e).includes('429') || String(e).includes('RESOURCE_EXHAUSTED');
            const errorMessage = isRateLimitError
                ? "API rate limit exceeded. Please wait a moment and try again."
                : "Failed to perform search. Please try again.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNewResearch = () => {
        setResult(null);
        setQuery('');
        setError(null);
    };
    
    return (
        <main className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <ErrorDisplay message={error} onDismiss={() => setError(null)} />
                    {isLoading && <Spinner message="Searching the web for insights..." />}

                    {result && !isLoading && (
                        <div className="space-y-6">
                            <Button variant="outline" onClick={handleNewResearch}>Start New Research</Button>
                            <div className="bg-card rounded-lg p-6 border border-border">
                                <h3 className="font-bold text-xl mb-4">Research Results</h3>
                                <div className="text-foreground whitespace-pre-wrap prose prose-invert max-w-none">
                                    <MarkdownRenderer text={result.text} />
                                </div>
                                {result.sources.length > 0 && (
                                    <div className="mt-8 border-t border-border pt-4">
                                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-muted-foreground"><Link className="h-5 w-5" /> Sources</h3>
                                        <ul className="space-y-2">
                                            {result.sources.map((source, index) => (
                                                <li key={index} className="text-sm">
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                                        {source.title || source.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!result && !isLoading && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-foreground">AI Research Assistant</h2>
                                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Get up-to-date, accurate information from the web, powered by Gemini and Google Search. Start with a suggestion below or type your own custom query.</p>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-center">Example Research Topics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {examplePrompts.map((prompt, index) => (
                                        <div 
                                            key={index}
                                            onClick={() => setQuery(prompt)}
                                            className="p-4 bg-card border border-border rounded-lg text-left hover:bg-accent hover:border-primary/50 transition-all cursor-pointer group"
                                        >
                                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{prompt}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 border-t border-border bg-background">
                <AIInputWithLoading
                    value={query}
                    onValueChange={setQuery}
                    onSubmit={handleSearch}
                    isLoading={isLoading}
                    placeholder="Ask anything about photography, editing, or creative trends..."
                />
            </div>
        </main>
    );
};
