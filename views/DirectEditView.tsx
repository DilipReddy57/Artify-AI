import React, { useState, useCallback } from 'react';
import { editTextWithMaskAndPrompt, editTextWithPrompt } from '../services/geminiService';
import { fileToBase64, downloadBase64Image } from '../utils/fileUtils';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/Spinner';
import { ImageUploader } from '../components/ImageUploader';
import { ImageModal } from '../components/ImageModal';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { LazyImage } from '../components/LazyImage';
import { Download, RotateCcw, XCircle, Brush } from 'lucide-react';
import { AIInputWithLoading } from '../components/ui/ai-input-with-loading';
import { MaskingEditor } from '../components/MaskingEditor';

export const DirectEditView: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{ url: string, base64: string, mimeType: string } | null>(null);
    const [editedImage, setEditedImage] = useState<{ url: string, base64: string, mimeType: string } | null>(null);
    const [mask, setMask] = useState<{ url: string, base64: string, mimeType: string } | null>(null);
    const [isMasking, setIsMasking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');

    const handleImageUpload = useCallback(async (file: File) => {
        const { base64, mimeType } = await fileToBase64(file);
        setOriginalImage({ url: URL.createObjectURL(file), base64, mimeType });
        setEditedImage(null);
        setError(null);
        setMask(null);
    }, []);

    const handleEdit = async (prompt: string) => {
        if (!originalImage || !prompt) return;
        setIsLoading(true);
        setError(null);
        try {
            const sourceForEdit = editedImage || originalImage;
            let result;
            if (mask) {
                result = await editTextWithMaskAndPrompt(
                    sourceForEdit.base64,
                    sourceForEdit.mimeType,
                    mask.base64,
                    mask.mimeType,
                    prompt
                );
            } else {
                result = await editTextWithPrompt(sourceForEdit.base64, sourceForEdit.mimeType, prompt);
            }

            if (!result.base64 || result.base64.trim() === '') {
                 throw new Error("Received empty image data from AI.");
            }

            const { base64: imageBase64, mimeType } = result;
            setEditedImage({ url: `data:${mimeType};base64,${imageBase64}`, base64: imageBase64, mimeType });
        } catch (e) {
            console.error(e);
             let errorMessage = "Failed to edit image. Please try again or adjust your prompt.";

            if (e instanceof Error) {
                if (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED')) {
                    errorMessage = "API rate limit exceeded. Please wait a moment and try again.";
                } else if (e.message.includes('empty image data')) {
                     errorMessage = "The AI failed to generate a valid image data. Please try again.";
                } else {
                     errorMessage = e.message;
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRevert = () => {
        setEditedImage(null);
        setError(null);
    };
    
    const handleReset = () => {
        setOriginalImage(null);
        setEditedImage(null);
        setError(null);
        setMask(null);
    };

    const currentImage = editedImage || originalImage;

    return (
        <>
            <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} onDownload={() => {
                if (editedImage) downloadBase64Image(editedImage.base64, editedImage.mimeType, 'artify-edited.png')
            }} />
            {isMasking && originalImage && (
                <MaskingEditor
                    imageUrl={originalImage.url}
                    mode="mask_creation"
                    onSave={(dataUrl) => {
                        const [header, base64] = dataUrl.split(',');
                        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
                        setMask({ url: dataUrl, base64, mimeType });
                        setIsMasking(false);
                    }}
                    onCancel={() => setIsMasking(false)}
                />
            )}
            <main className="h-full flex flex-col">
                <div className="flex-grow overflow-y-auto bg-black/20 flex items-center justify-center p-4 relative">
                    <ErrorDisplay message={error} onDismiss={() => setError(null)} />
                    {isLoading && <Spinner message="Applying your edit..." />}
                    
                    {!isLoading && originalImage && (
                        <>
                           <div className="w-full h-full cursor-zoom-in" onClick={() => setModalImage(currentImage?.url ?? null)}>
                                <LazyImage src={currentImage?.url} alt="Current" className="max-w-full max-h-full object-contain rounded-md" />
                            </div>
                            <div className="absolute top-4 right-4 flex gap-2 z-20">
                                {editedImage && (
                                    <Button variant="secondary" size="icon" onClick={handleRevert} aria-label="Revert to original">
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button variant="secondary" size="icon" onClick={handleReset} aria-label="Start over with a new image">
                                    <XCircle className="h-4 w-4" />
                                </Button>
                                {editedImage && (
                                    <Button variant="secondary" size="icon" onClick={() => downloadBase64Image(editedImage.base64, editedImage.mimeType, 'artify-edited.png')} aria-label="Download image">
                                        <Download className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>
                        </>
                    )}

                    {!isLoading && !originalImage && (
                         <div className='w-full max-w-md p-4 flex flex-col items-center text-center gap-4'>
                            <h2 className="text-3xl font-bold text-foreground">Magic Edit</h2>
                            <p className="text-muted-foreground -mt-2">Use conversational prompts to make complex changes to your image.</p>
                            <ImageUploader onImageUpload={handleImageUpload} imageUrl={null} />
                         </div>
                    )}
                </div>
                
                {originalImage && (
                    <div className="flex-shrink-0 border-t border-border bg-background p-4 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-4 w-full max-w-xl">
                            <Button variant={mask ? 'default' : 'outline'} onClick={() => setIsMasking(true)} disabled={isLoading} size="sm">
                                <Brush className="w-4 h-4 mr-2"/>
                                {mask ? 'Edit Mask' : 'Create Mask'}
                            </Button>
                            {mask && (
                                <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-secondary/50 flex-grow">
                                    <img src={mask.url} alt="Mask preview" className="w-8 h-8 rounded-md border bg-white"/>
                                    <p className="text-muted-foreground">Mask active. Edits will apply to the selected area.</p>
                                    <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => setMask(null)} aria-label="Remove mask">
                                        <XCircle className="h-4 w-4 text-muted-foreground"/>
                                    </Button>
                                </div>
                            )}
                        </div>
                        <AIInputWithLoading
                            onSubmit={handleEdit}
                            isLoading={isLoading}
                            placeholder={mask ? "e.g., 'make this area a vibrant sunset'" : "e.g., 'remove the car' or 'change the sky'"}
                            value={prompt}
                            onValueChange={setPrompt}
                        />
                    </div>
                )}
            </main>
        </>
    );
};
