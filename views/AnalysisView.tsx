import React, { useState, useCallback } from 'react';
import { analyzeImageStyle, extractColorPalette, describeImageContent } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { ImageUploader } from '../components/ImageUploader';
import { Spinner } from '../components/Spinner';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { AnalysisDisplay } from '../components/AnalysisDisplay';
import { EffectsAnalysisResponse, IdentifiedStyle } from '../types';
import { LazyImage } from '../components/LazyImage';
import { StyleInfoModal } from '../components/StyleInfoModal';

const ALL_SECTIONS = new Set(['color_grading', 'exposure_and_contrast', 'texture_and_sharpness', 'special_effects', 'lighting']);

export const AnalysisView: React.FC = () => {
    const [image, setImage] = useState<{ url: string, base64: string, mimeType: string } | null>(null);
    const [analysis, setAnalysis] = useState<EffectsAnalysisResponse | null>(null);
    const [palette, setPalette] = useState<string[] | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalStyle, setModalStyle] = useState<IdentifiedStyle | null>(null);

    const handleImageUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        setPalette(null);
        setDescription(null);

        const { base64, mimeType } = await fileToBase64(file);
        const imageUrl = URL.createObjectURL(file);
        setImage({ url: imageUrl, base64, mimeType });

        try {
            const [analysisResult, paletteResult, descriptionResult] = await Promise.all([
                analyzeImageStyle(base64, mimeType, false), // Use fast model for analysis view
                extractColorPalette(base64, mimeType),
                describeImageContent(base64, mimeType)
            ]);
            setAnalysis(analysisResult);
            setPalette(paletteResult);
            setDescription(descriptionResult);
        } catch (e) {
            console.error(e);
            const isRateLimitError = String(e).includes('429') || String(e).includes('RESOURCE_EXHAUSTED');
            const errorMessage = isRateLimitError
                ? "API rate limit exceeded. Please wait a moment and try again."
                : "Failed to analyze the image. Please try another one.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <>
            <StyleInfoModal style={modalStyle} onClose={() => setModalStyle(null)} />
            <main className="h-full flex flex-col">
                {!image && !isLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-full max-w-lg space-y-4">
                            <h2 className="text-3xl font-bold text-foreground">Deconstruct Any Style</h2>
                            <p className="text-muted-foreground">Ever wonder how a photo gets its unique look? Upload any image and our AI will deconstruct it, revealing the exact color palette, typography, and sequence of effects used.</p>
                            <div className="h-64 mt-6">
                                <ImageUploader onImageUpload={handleImageUpload} imageUrl={null} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <ErrorDisplay message={error} onDismiss={() => setError(null)} />
                            {isLoading && <Spinner message="Analyzing your image..." />}
                            
                            {image && (
                                <div className="bg-card rounded-lg p-2 flex flex-col text-sm border border-border">
                                    <h3 className="font-semibold text-muted-foreground mb-2 px-2">Uploaded Image</h3>
                                    <div className="bg-black/20 rounded-md flex items-center justify-center relative flex-grow aspect-video">
                                         <LazyImage src={image.url} alt="Uploaded for analysis" className="max-w-full max-h-full object-contain rounded-md" />
                                    </div>
                                </div>
                            )}

                            {analysis && !isLoading && (
                                <div className="bg-card rounded-lg p-6 border border-border space-y-6">
                                    {description && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Content Description</h4>
                                            <p className="text-sm text-foreground bg-background p-3 rounded-md border border-border">{description}</p>
                                        </div>
                                    )}
                                    {analysis.identified_style && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Identified Style</h4>
                                            <button onClick={() => setModalStyle(analysis.identified_style)} className="w-full text-left text-base font-semibold text-primary bg-primary/10 p-2 rounded-md border border-primary/20 hover:bg-primary/20 transition-colors">
                                                {analysis.identified_style.category} - <span className='font-bold'>{analysis.identified_style.style}</span>
                                            </button>
                                        </div>
                                    )}
                                    <AnalysisDisplay
                                        analysis={analysis}
                                        palette={palette}
                                        paletteTitle="Dominant Colors"
                                        activeSections={ALL_SECTIONS}
                                        onToggleSection={() => {}} // Read-only, so no-op
                                        editingPlan={analysis.editing_plan || null}
                                        onEditingPlanChange={() => {}} // Read-only, so no-op
                                        isPlanEditable={false}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
};