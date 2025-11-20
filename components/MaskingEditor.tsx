import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Brush, Eraser, MoveHorizontal, Check, X } from 'lucide-react';
import { Button } from './ui/button';

type MaskingMode = 'mask_creation' | 'blending';

interface MaskingEditorProps {
    imageUrl: string;
    mode: MaskingMode;
    backgroundImageUrl?: string; // For blending mode
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

const ToolButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode, label: string }> = ({ active, onClick, children, label }) => (
    <Button variant={active ? 'default' : 'secondary'} size="icon" onClick={onClick} title={label} aria-label={label}>
        {children}
    </Button>
);

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};


export const MaskingEditor: React.FC<MaskingEditorProps> = ({ imageUrl, mode, backgroundImageUrl, onSave, onCancel }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    const setupCanvases = useCallback(async () => {
        const imageCanvas = imageCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        const container = containerRef.current;
        if (!imageCanvas || !drawingCanvas || !container) return;

        const image = await loadImage(imageUrl);

        const { width, height } = container.getBoundingClientRect();
        const imageAspectRatio = image.width / image.height;
        const containerAspectRatio = width / height;

        let drawWidth, drawHeight;
        if (imageAspectRatio > containerAspectRatio) {
            drawWidth = width;
            drawHeight = width / imageAspectRatio;
        } else {
            drawHeight = height;
            drawWidth = height * imageAspectRatio;
        }

        [imageCanvas, drawingCanvas].forEach(canvas => {
            canvas.width = drawWidth;
            canvas.height = drawHeight;
        });

        const imageCtx = imageCanvas.getContext('2d');
        if (!imageCtx) return;
        
        imageCtx.drawImage(image, 0, 0, drawWidth, drawHeight);

    }, [imageUrl]);

    useEffect(() => {
        setupCanvases();
        window.addEventListener('resize', setupCanvases);
        return () => window.removeEventListener('resize', setupCanvases);
    }, [setupCanvases]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = drawingCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        lastPoint.current = getCoords(e);
    };

    const finishDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(false);
        lastPoint.current = null;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = drawingCanvasRef.current;
        const context = canvas?.getContext('2d');
        if (!context || !lastPoint.current) return;
        
        const currentPoint = getCoords(e);
        
        context.beginPath();
        context.moveTo(lastPoint.current.x, lastPoint.current.y);
        context.lineTo(currentPoint.x, currentPoint.y);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = brushSize;
        
        if (tool === 'brush') {
            context.globalCompositeOperation = 'source-over';
            context.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // Semi-transparent red overlay
        } else { // eraser
            context.globalCompositeOperation = 'destination-out';
            context.strokeStyle = 'rgba(0,0,0,1)';
        }
        
        context.stroke();
        lastPoint.current = currentPoint;
    };
    
    const handleSave = async () => {
        const imageCanvas = imageCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        if (!imageCanvas || !drawingCanvas) return;

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = imageCanvas.width;
        resultCanvas.height = imageCanvas.height;
        const ctx = resultCanvas.getContext('2d');
        if (!ctx) return;
        
        if (mode === 'mask_creation') {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
            
            const drawingCtx = drawingCanvas.getContext('2d', { willReadFrequently: true });
            if (!drawingCtx) return;
            const drawingData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
            const resultData = ctx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
            
            for (let i = 0; i < drawingData.data.length; i += 4) {
                if (drawingData.data[i + 3] > 0) { // Check alpha channel
                    resultData.data[i] = 255;
                    resultData.data[i + 1] = 255;
                    resultData.data[i + 2] = 255;
                }
            }
            ctx.putImageData(resultData, 0, 0);
            onSave(resultCanvas.toDataURL('image/png'));
            
        } else { // blending mode
            if (!backgroundImageUrl) return;

            const bgImg = await loadImage(backgroundImageUrl);
            ctx.drawImage(bgImg, 0, 0, resultCanvas.width, resultCanvas.height);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = resultCanvas.width;
            tempCanvas.height = resultCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;
            
            tempCtx.drawImage(imageCanvas, 0, 0);
            tempCtx.globalCompositeOperation = 'destination-out';
            tempCtx.drawImage(drawingCanvas, 0, 0);

            ctx.drawImage(tempCanvas, 0, 0);
            onSave(resultCanvas.toDataURL('image/png'));
        }
    };


    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg shadow-md">
                    <ToolButton active={tool === 'brush'} onClick={() => setTool('brush')} label="Brush"><Brush className="w-5 h-5"/></ToolButton>
                    <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} label="Eraser"><Eraser className="w-5 h-5"/></ToolButton>
                    <div className="flex items-center gap-2 pl-2">
                        <MoveHorizontal className="w-5 h-5 text-muted-foreground"/>
                        <input
                            type="range"
                            min="5"
                            max="150"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-32 cursor-pointer"
                            aria-label="Brush size"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={onCancel}><X className="w-4 h-4 mr-2"/>Cancel</Button>
                    <Button onClick={handleSave}><Check className="w-4 h-4 mr-2"/>Apply</Button>
                </div>
            </div>
            <div ref={containerRef} className="relative flex-grow flex items-center justify-center w-full h-full max-h-[calc(100vh-100px)]">
                 <canvas ref={imageCanvasRef} className="absolute rounded-lg shadow-lg" />
                 <canvas
                    ref={drawingCanvasRef}
                    className="absolute cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseUp={finishDrawing}
                    onMouseLeave={finishDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={finishDrawing}
                    onTouchCancel={finishDrawing}
                    onTouchMove={draw}
                />
            </div>
        </div>
    );
};