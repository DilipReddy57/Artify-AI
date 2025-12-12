
import React, { useState } from 'react';
import { Header } from './components/Header';
import { StyleTransferView } from './views/StyleTransferView';
import { ImageGenerationView } from './views/ImageGenerationView';
import { DirectEditView } from './views/DirectEditView';
import { InspirationView } from './views/InspirationView';
import { AnalysisView } from './views/AnalysisView';
import { ResearchView } from './views/ResearchView';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { Inspiration, ImageGenerationInitialProps, StyleTransferInitialProps } from './types';

export type View = 'style' | 'generate' | 'edit' | 'inspiration' | 'analyze' | 'research';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('inspiration');
    const [initialViewProps, setInitialViewProps] = useState<any>(null);

    const handleSelectInspiration = (inspiration: Inspiration, action: 'style' | 'generate') => {
        if (action === 'style') {
            setInitialViewProps({ sourceImageUrl: inspiration.imageUrl, sourceImageName: inspiration.title });
            setActiveView('style');
        } else {
            setInitialViewProps({ prompt: inspiration.prompt });
            setActiveView('generate');
        }
    };
    
    const handleSetActiveView = (view: View) => {
        setInitialViewProps(null);
        setActiveView(view);
    };

    const renderView = () => {
        const key = JSON.stringify(initialViewProps); 

        switch (activeView) {
            case 'style':
                return <StyleTransferView key={key} initialProps={initialViewProps as StyleTransferInitialProps | null} />;
            case 'generate':
                return <ImageGenerationView key={key} initialProps={initialViewProps as ImageGenerationInitialProps | null} />;
            case 'edit':
                return <DirectEditView />;
            case 'inspiration':
                return <InspirationView onSelectInspiration={handleSelectInspiration} setActiveView={handleSetActiveView} />;
            case 'analyze':
                return <AnalysisView />;
            case 'research':
                return <ResearchView />;
            default:
                return <StyleTransferView key={key} initialProps={null} />;
        }
    };

    return (
        <ErrorBoundary>
            <div className="bg-background text-foreground flex flex-col h-screen font-sans">
                <Header activeView={activeView} setActiveView={handleSetActiveView} />
                <div className="flex flex-col flex-grow overflow-hidden">
                    <div className="flex-grow overflow-y-auto min-h-0">
                        <ErrorBoundary>
                            {renderView()}
                        </ErrorBoundary>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default App;
