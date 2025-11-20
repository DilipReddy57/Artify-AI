import React, { useState, useEffect } from 'react';
import { generateImage } from '../services/geminiService';
import { downloadBase64Image } from '../utils/fileUtils';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/Spinner';
import { ImageModal } from '../components/ImageModal';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { ImageGenerationInitialProps } from '../types';
import { LazyImage } from '../components/LazyImage';
import { Download, Search } from 'lucide-react';

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const presetStyles = [
  { name: 'Cinematic', prompt: ', cinematic, dramatic lighting, high detail, film grain' },
  { name: 'Photorealistic', prompt: ', photorealistic, 8k, hyper-detailed, sharp focus, professional photography' },
  { name: 'Vintage Photo', prompt: ', vintage photograph, 1950s, sepia tones, faded, scratches and dust' },
  { name: 'Anime', prompt: ', anime style, vibrant, cel-shaded, key visual, studio ghibli' },
  { name: 'Watercolor', prompt: ', watercolor painting, soft edges, paper texture, vibrant colors' },
  { name: 'Pixel Art', prompt: ', 16-bit pixel art, retro gaming style, detailed pixels' },
  { name: 'Cyberpunk', prompt: ', cyberpunk city, neon lights, dystopian future, high-tech low-life' },
  { name: 'Fantasy Art', prompt: ', fantasy art, epic, detailed, oil painting, Dungeons and Dragons' },
  { name: 'Line Art', prompt: ', minimalist line art, black and white, clean, modern' },
  { name: '3D Model', prompt: ', 3d model, rendered in Blender, Pixar style, smooth shading' },
];


export const ImageGenerationView: React.FC<{initialProps: ImageGenerationInitialProps | null}> = ({ initialProps }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [generatedImage, setGeneratedImage] = useState<{url: string; base64: string; mimeType: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

    useEffect(() => {
        if (initialProps?.prompt) {
            setPrompt(initialProps.prompt);
        }
    }, [initialProps]);


    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const imageBase64 = await generateImage(prompt, aspectRatio);
            const mimeType = 'image/jpeg';
            setGeneratedImage({
                url: `data:${mimeType};base64,${imageBase64}`,
                base64: imageBase64,
                mimeType
            });
        } catch (e) {
            console.error(e);
            const isRateLimitError = String(e).includes('429') || String(e).includes('RESOURCE_EXHAUSTED');
            const errorMessage = isRateLimitError
                ? "API rate limit exceeded. Please wait a moment and try again."
                : "Failed to generate image. Please try again or refine your prompt.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectStyle = (style: { name: string; prompt: string }) => {
        // If the same style is clicked again, deselect it.
        if (selectedStyle === style.name) {
            setPrompt(p => p.replace(style.prompt, '').trim().replace(/,$/, ''));
            setSelectedStyle(null);
            return;
        }

        // Remove the prompt of the previously selected style, if any.
        let newPrompt = prompt;
        const previousStyle = presetStyles.find(s => s.name === selectedStyle);
        if (previousStyle) {
            newPrompt = newPrompt.replace(previousStyle.prompt, '');
        }
        
        // Append the new style's prompt.
        newPrompt = `${newPrompt.trim().replace(/,$/, '')}${style.prompt}`;
        
        setPrompt(newPrompt);
        setSelectedStyle(style.name);
    };

    const handleClearStyle = () => {
        if (!selectedStyle) return;
        const styleToClear = presetStyles.find(s => s.name === selectedStyle);
        if (styleToClear) {
            setPrompt(p => p.replace(styleToClear.prompt, '').trim().replace(/,$/, ''));
        }
        setSelectedStyle(null);
    };


    return (
        <>
            <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} onDownload={() => {
                if (generatedImage) downloadBase64Image(generatedImage.base64, generatedImage.mimeType, 'artify-generated.jpg')
            }} />
            <main className="flex-grow p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-card rounded-lg p-4 flex items-center justify-center">
                    <div className="w-full h-full bg-black/20 rounded-md flex items-center justify-center relative">
                        {isLoading ? (
                            <Spinner message="Generating your masterpiece..." />
                        ) : generatedImage ? (
                            <div className="w-full h-full relative group">
                                <LazyImage src={generatedImage.url} alt="Generated" className="max-w-full max-h-full object-contain rounded-md" />
                                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="icon" onClick={() => setModalImage(generatedImage.url)} aria-label="Zoom in"><Search className="h-4 w-4"/></Button>
                                    <Button variant="secondary" size="icon" onClick={() => downloadBase64Image(generatedImage.base64, generatedImage.mimeType, 'artify-generated.jpg')} aria-label="Download image"><Download className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center p-4">Your generated image will appear here.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 bg-card rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
                    <h3 className="font-bold text-lg">Image Generation</h3>
                    <p className="text-sm text-muted-foreground">Describe the image you want to create. Be as specific as possible for the best results.</p>
                    
                    <ErrorDisplay message={error} onDismiss={() => setError(null)} />

                    <div className="flex flex-col gap-2">
                        <label htmlFor="prompt" className="font-semibold text-sm">Prompt</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'A majestic lion wearing a crown'"
                            className="w-full bg-input border border-border rounded-md p-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none transition"
                            rows={5}
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-sm">Style Presets</label>
                         <div className="flex flex-wrap gap-2">
                             <Button
                                size="sm"
                                variant={selectedStyle === null ? 'default' : 'secondary'}
                                onClick={handleClearStyle}
                                disabled={isLoading}
                            >
                                None
                            </Button>
                            {presetStyles.map(style => (
                                <Button
                                    key={style.name}
                                    size="sm"
                                    variant={selectedStyle === style.name ? 'default' : 'secondary'}
                                    onClick={() => handleSelectStyle(style)}
                                    disabled={isLoading}
                                >
                                    {style.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-sm">Aspect Ratio</label>
                        <div className="grid grid-cols-5 gap-2">
                            {aspectRatios.map(ar => (
                                <Button
                                    key={ar}
                                    variant={aspectRatio === ar ? 'default' : 'secondary'}
                                    onClick={() => setAspectRatio(ar)}
                                    disabled={isLoading}
                                >
                                    {ar}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full mt-auto">
                        {isLoading ? 'Generating...' : 'Generate Image'}
                    </Button>
                </div>
            </main>
        </>
    );
};