
import React, { useReducer, useCallback, useEffect, useState, useRef } from 'react';
import { analyzeImageStyle, replicateStyle, extractColorPalette, editTextWithPrompt, describeImageContent, detectConflicts } from '../services/geminiService';
import { fileToBase64, downloadBase64Image, fetchImageAsBase64 } from '../utils/fileUtils';
import type { EffectsAnalysisResponse, ConflictInfo, StyleTransferInitialProps } from '../types';
import { ImageUploader } from '../components/ImageUploader';
import { AnalysisDisplay } from '../components/AnalysisDisplay';
import { Spinner } from '../components/Spinner';
import { Button } from '../components/ui/button';
import { ImageModal } from '../components/ImageModal';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { AIAssistant } from '../components/AIAssistant';
import { LazyImage } from '../components/LazyImage';
import { ConflictDisplay } from '../components/ConflictDisplay';
import { MaskingEditor } from '../components/MaskingEditor';
import { Layers, Sparkles, Trash2, Download, Search, ChevronsLeft, ChevronsRight, RotateCcw, Rows3, Columns3, Brush, Zap } from 'lucide-react';

// --- STATE MANAGEMENT ---
type AnalysisSection = 'color_grading' | 'exposure_and_contrast' | 'texture_and_sharpness' | 'special_effects' | 'lighting';
type LayoutMode = 'horizontal' | 'vertical';

type State = {
    sourceImage: { url: string; base64: string; mimeType: string } | null;
    targetImage: { url: string; base64: string; mimeType: string } | null;
    resultHistory: { url: string; base64: string; mimeType: string }[];
    analysis: EffectsAnalysisResponse | null;
    conflicts: ConflictInfo[] | null;
    editingPlan: string[] | null;
    activeSections: Set<AnalysisSection>;
    imageDescription: string | null;
    sourceColorPalette: string[] | null;
    useThinkingMode: boolean;
    loadingState: {
        isLoading: boolean;
        isAnalyzing: boolean;
        isReplicating: boolean;
        isDetectingConflicts: boolean;
        message: string;
    };
    error: string | null;
    modalImage: string | null;
    layoutMode: LayoutMode;
};

type Action =
    | { type: 'START_LOADING'; payload: { message: string; stage: 'analysis' | 'replication' | 'conflict_detection' } }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'DISMISS_ERROR' }
    | { type: 'SET_SOURCE_IMAGE'; payload: State['sourceImage'] }
    | { type: 'SET_TARGET_IMAGE'; payload: State['targetImage'] }
    | { type: 'SET_REPLICATION_RESULT'; payload: { url: string; base64: string; mimeType: string } }
    | { type: 'ADD_REFINEMENT_RESULT'; payload: { url: string; base64: string; mimeType: string } }
    | { type: 'UNDO_EDIT' }
    | { type: 'SET_ANALYSIS_RESULT'; payload: { analysis: State['analysis']; palette: State['sourceColorPalette']; description: State['imageDescription'] } }
    | { type: 'SET_CONFLICTS'; payload: { conflicts: ConflictInfo[], newActiveSections?: Set<AnalysisSection> } }
    | { type: 'UPDATE_EDITING_PLAN'; payload: string[] }
    | { type: 'TOGGLE_SECTION'; payload: AnalysisSection }
    | { type: 'TOGGLE_THINKING_MODE' }
    | { type: 'RESET_SOURCE' }
    | { type: 'RESET_TARGET' }
    | { type: 'SHOW_MODAL'; payload: string }
    | { type: 'HIDE_MODAL' }
    | { type: 'SET_LAYOUT_MODE'; payload: LayoutMode };

const ALL_SECTIONS: AnalysisSection[] = ['color_grading', 'exposure_and_contrast' | 'texture_and_sharpness' | 'special_effects' | 'lighting'] as any; // Quick fix for TS type inference in map/init

const initialState: State = {
    sourceImage: null,
    targetImage: null,
    resultHistory: [],
    analysis: null,
    conflicts: null,
    editingPlan: null,
    activeSections: new Set(['color_grading', 'exposure_and_contrast', 'texture_and_sharpness', 'special_effects', 'lighting'] as AnalysisSection[]),
    imageDescription: null,
    sourceColorPalette: null,
    useThinkingMode: false,
    loadingState: { isLoading: false, isAnalyzing: false, isReplicating: false, isDetectingConflicts: false, message: '' },
    error: null,
    modalImage: null,
    layoutMode: 'horizontal',
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'START_LOADING':
            return {
                ...state,
                loadingState: {
                    isLoading: true,
                    isAnalyzing: action.payload.stage === 'analysis',
                    isReplicating: action.payload.stage === 'replication',
                    isDetectingConflicts: action.payload.stage === 'conflict_detection',
                    message: action.payload.message
                },
                error: null,
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loadingState: { ...initialState.loadingState }
            };
        case 'DISMISS_ERROR':
            return { ...state, error: null };
        case 'SET_SOURCE_IMAGE':
            return { ...state, sourceImage: action.payload, resultHistory: [], analysis: null, error: null, targetImage: null, conflicts: null };
        case 'SET_TARGET_IMAGE':
            return { ...state, targetImage: action.payload, resultHistory: [], error: null, conflicts: null };
        case 'SET_REPLICATION_RESULT':
            return { ...state, resultHistory: [action.payload], loadingState: initialState.loadingState };
        case 'ADD_REFINEMENT_RESULT':
            return { ...state, resultHistory: [...state.resultHistory, action.payload], loadingState: initialState.loadingState };
        case 'UNDO_EDIT':
            if (state.resultHistory.length <= 1) {
                return state;
            }
            return { ...state, resultHistory: state.resultHistory.slice(0, -1) };
        case 'SET_ANALYSIS_RESULT':
            return {
                ...state,
                analysis: action.payload.analysis,
                sourceColorPalette: action.payload.palette,
                imageDescription: action.payload.description,
                editingPlan: action.payload.analysis?.editing_plan || null,
                loadingState: initialState.loadingState
            };
        case 'SET_CONFLICTS':
            return {
                ...state,
                conflicts: action.payload.conflicts,
                activeSections: action.payload.newActiveSections || state.activeSections,
                loadingState: initialState.loadingState
            };
        case 'UPDATE_EDITING_PLAN':
            return { ...state, editingPlan: action.payload };
        case 'TOGGLE_SECTION': {
            const newSections = new Set(state.activeSections);
            if (newSections.has(action.payload)) {
                newSections.delete(action.payload);
            } else {
                newSections.add(action.payload);
            }
            return { ...state, activeSections: newSections };
        }
        case 'TOGGLE_THINKING_MODE':
            return { ...state, useThinkingMode: !state.useThinkingMode };
        case 'RESET_SOURCE':
            return {
                ...initialState,
            };
        case 'RESET_TARGET':
            return { ...state, targetImage: null, resultHistory: [], error: null, conflicts: null };
        case 'SHOW_MODAL':
            return { ...state, modalImage: action.payload };
        case 'HIDE_MODAL':
            return { ...state, modalImage: null };
        case 'SET_LAYOUT_MODE':
            return { ...state, layoutMode: action.payload };
        default:
            return state;
    }
}


export const StyleTransferView: React.FC<{ initialProps: StyleTransferInitialProps | null }> = ({ initialProps }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [isBlending, setIsBlending] = useState(false);

    // Sidebar Resizing State
    const [sidebarWidth, setSidebarWidth] = useState(380);
    const [isResizing, setIsResizing] = useState(false);
    const preCollapseWidth = useRef(380);
    const isSidebarCollapsed = sidebarWidth === 0;

    const {
        sourceImage, targetImage, resultHistory, analysis, editingPlan, activeSections,
        sourceColorPalette, useThinkingMode, loadingState, error,
        modalImage, conflicts, layoutMode
    } = state;

    const finalImage = resultHistory.length > 0 ? resultHistory[resultHistory.length - 1] : null;

    // --- RESIZING LOGIC ---
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing) {
            requestAnimationFrame(() => {
                const newWidth = Math.max(280, Math.min(e.clientX, 600));
                setSidebarWidth(newWidth);
            });
        }
    }, [isResizing]);
    
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    const toggleSidebar = () => {
        if (sidebarWidth > 0) {
            preCollapseWidth.current = sidebarWidth;
            setSidebarWidth(0);
        } else {
            setSidebarWidth(preCollapseWidth.current);
        }
    };


    const performAnalysis = useCallback(async (base64: string, mimeType: string) => {
        dispatch({ type: 'START_LOADING', payload: { message: useThinkingMode ? 'Deep analysis with Gemini 3.0 Pro...' : 'Deconstructing style...', stage: 'analysis' } });
        try {
            const [analysisResult, paletteResult, descriptionResult] = await Promise.all([
                analyzeImageStyle(base64, mimeType, useThinkingMode),
                extractColorPalette(base64, mimeType),
                describeImageContent(base64, mimeType)
            ]);
            dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { analysis: analysisResult, palette: paletteResult, description: descriptionResult } });
        } catch (e) {
            console.error(e);
            const isRateLimitError = String(e).includes('429') || String(e).includes('RESOURCE_EXHAUSTED');
            const errorMessage = isRateLimitError
                ? "API rate limit exceeded. Please wait a moment and try again."
                : e instanceof Error ? e.message : "Failed to analyze the image.";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
        }
    }, [useThinkingMode]);

    // Re-analyze when switching modes if source exists
    useEffect(() => {
        if (sourceImage && !loadingState.isLoading) {
            performAnalysis(sourceImage.base64, sourceImage.mimeType);
        }
    }, [useThinkingMode]);


    useEffect(() => {
        if (initialProps?.sourceImageUrl && !sourceImage) {
            const loadInitialImage = async () => {
                dispatch({ type: 'START_LOADING', payload: { message: 'Loading inspiration...', stage: 'analysis' } });
                try {
                    const { base64, mimeType } = await fetchImageAsBase64(initialProps.sourceImageUrl);
                    dispatch({ type: 'SET_SOURCE_IMAGE', payload: { url: initialProps.sourceImageUrl, base64, mimeType } });
                    await performAnalysis(base64, mimeType);
                } catch (e) {
                    dispatch({ type: 'SET_ERROR', payload: 'Failed to load inspiration image.' });
                }
            };
            loadInitialImage();
        }
    }, [initialProps, performAnalysis, sourceImage]);

    // Effect for conflict detection
    useEffect(() => {
        if (sourceImage && targetImage) {
            const runConflictDetection = async () => {
                dispatch({ type: 'START_LOADING', payload: { message: 'Analyzing compatibility...', stage: 'conflict_detection' } });
                try {
                    const detectedConflicts = await detectConflicts(sourceImage.base64, sourceImage.mimeType, targetImage.base64, targetImage.mimeType);
                    
                    let newActiveSections = new Set(['color_grading', 'exposure_and_contrast', 'texture_and_sharpness', 'special_effects', 'lighting'] as AnalysisSection[]);
                    // Handle adaptive UI based on primary conflict
                    if (detectedConflicts.length > 0) {
                        const primaryConflict = detectedConflicts[0];
                        if (primaryConflict.approach === 'EXTRACT_AMBIENT_MOOD_ONLY') {
                           newActiveSections.delete('texture_and_sharpness');
                           newActiveSections.delete('special_effects');
                        }
                    }
                    
                    dispatch({ type: 'SET_CONFLICTS', payload: { conflicts: detectedConflicts, newActiveSections } });
                } catch (e) {
                    dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : "Failed to run compatibility check." });
                }
            };
            runConflictDetection();
        }
    }, [sourceImage, targetImage]);


    const handleSourceUpload = useCallback(async (file: File) => {
        const { base64, mimeType } = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        dispatch({ type: 'SET_SOURCE_IMAGE', payload: { url, base64, mimeType } });
        await performAnalysis(base64, mimeType);
    }, [performAnalysis]);

    const handleTargetUpload = useCallback(async (file: File) => {
        const { base64, mimeType } = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        dispatch({ type: 'SET_TARGET_IMAGE', payload: { url, base64, mimeType } });
    }, []);

    const executeReplication = useCallback(async (
        analysisToUse: EffectsAnalysisResponse,
        sourceCtx: { base64: string, mimeType: string } | null,
        instructions: string | null
    ) => {
        if (!targetImage) return;

        dispatch({ type: 'START_LOADING', payload: { message: instructions ? 'Applying guided style...' : 'Applying style...', stage: 'replication' } });
        
        const activeAnalysis: Partial<EffectsAnalysisResponse> = {
            identified_style: analysisToUse.identified_style,
            editing_plan: editingPlan || undefined
        };
        for (const section of activeSections) {
            if (analysisToUse[section as keyof typeof analysisToUse]) {
                (activeAnalysis as any)[section] = analysisToUse[section as keyof typeof analysisToUse];
            }
        }
        
        try {
            const result = await replicateStyle(targetImage.base64, targetImage.mimeType, activeAnalysis, sourceCtx, instructions);

            if (!result.base64 || result.base64.trim() === '') {
                 throw new Error("Received empty image data from AI.");
            }

            const url = `data:${result.mimeType};base64,${result.base64}`;
            dispatch({ type: 'SET_REPLICATION_RESULT', payload: { url, ...result } });
        } catch (e) {
            console.error(e);
             let errorMessage = 'An unknown error occurred during style transfer.';

            if (e instanceof Error) {
                if (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED')) {
                    errorMessage = "API rate limit exceeded. Please wait a moment and try again.";
                } else if (e.message.includes('empty image data')) {
                    errorMessage = "The AI failed to generate a valid image data. Please try again.";
                } else {
                     errorMessage = e.message;
                }
            }
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
        }
    }, [targetImage, activeSections, editingPlan]);

    const handleReplicate = useCallback(async () => {
        if (analysis && targetImage) {
            await executeReplication(analysis, sourceImage, null);
        }
    }, [analysis, targetImage, sourceImage, executeReplication]);

    const handleGuidedReplicate = useCallback(async (instructions: string) => {
        if (!analysis || !instructions || !targetImage || !sourceImage) return;
        await executeReplication(analysis, sourceImage, instructions);
    }, [analysis, targetImage, sourceImage, executeReplication]);


    const handleRefineWithPrompt = useCallback(async (prompt: string) => {
        const imageToEdit = finalImage || targetImage;
        if (!imageToEdit) return;
        dispatch({ type: 'START_LOADING', payload: { message: 'Refining image...', stage: 'replication' } });
        try {
            const result = await editTextWithPrompt(imageToEdit.base64, imageToEdit.mimeType, prompt);
             if (!result.base64 || result.base64.trim() === '') {
                 throw new Error("Received empty image data from AI.");
            }
            const url = `data:${result.mimeType};base64,${result.base64}`;
            dispatch({ type: 'ADD_REFINEMENT_RESULT', payload: { url, ...result } });
        } catch (e) {
             let errorMessage = 'An unknown error occurred during refinement.';
             if (e instanceof Error) {
                 if (e.message.includes('empty image data')) {
                     errorMessage = "The AI failed to generate a valid image data. Please try again.";
                 } else {
                     errorMessage = e.message;
                 }
             }
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
        }
    }, [resultHistory, targetImage, finalImage]);


    const assistantAction = finalImage ? handleRefineWithPrompt : handleGuidedReplicate;
    
    const assistantLabel = finalImage
        ? "Refine with AI"
        : "Guided Transfer (Optional)";
    
    const assistantPlaceholder = finalImage
        ? "e.g., 'make it a bit brighter' or 'increase the contrast'"
        : "e.g., 'Use the source's colors but keep the target's lighting'";


    return (
        <>
            <ImageModal imageUrl={modalImage} onClose={() => dispatch({ type: 'HIDE_MODAL' })} onDownload={() => {
                if (finalImage) downloadBase64Image(finalImage.base64, finalImage.mimeType, 'artify-replicated.png')
            }} />
            {isBlending && finalImage && targetImage && (
                <MaskingEditor
                    imageUrl={finalImage.url}
                    mode="blending"
                    backgroundImageUrl={targetImage.url}
                    onSave={(dataUrl) => {
                        const [header, base64] = dataUrl.split(',');
                        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
                        dispatch({ type: 'ADD_REFINEMENT_RESULT', payload: { url: dataUrl, base64, mimeType } });
                        setIsBlending(false);
                    }}
                    onCancel={() => setIsBlending(false)}
                />
            )}
            <main className="flex h-full overflow-hidden">
                {/* Sidebar */}
                <aside
                    style={{ width: `${sidebarWidth}px`, transition: isResizing ? 'none' : 'width 0.3s ease-in-out' }}
                    className={`flex flex-col bg-card border-r border-border flex-shrink-0 ${sidebarWidth === 0 ? 'p-0 overflow-hidden' : 'p-0'}`}
                >
                     <div className="flex-shrink-0 p-3 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Analysis Model</span>
                        <Button 
                            variant={useThinkingMode ? "default" : "outline"} 
                            size="sm" 
                            className="h-7 text-xs gap-2"
                            onClick={() => dispatch({ type: 'TOGGLE_THINKING_MODE' })}
                            title={useThinkingMode ? "Using Gemini 3.0 Pro (Deep Reasoning)" : "Using Gemini 2.5 Flash (Fast)"}
                        >
                            {useThinkingMode ? <Sparkles className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            {useThinkingMode ? 'Gemini 3.0 Pro (Deep Think)' : 'Gemini 2.5 Flash'}
                        </Button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4" style={{ display: isSidebarCollapsed ? 'none' : 'block' }}>
                        {analysis ? (
                            <AnalysisDisplay
                                analysis={analysis}
                                palette={sourceColorPalette}
                                activeSections={activeSections}
                                onToggleSection={(section) => dispatch({ type: 'TOGGLE_SECTION', payload: section as AnalysisSection })}
                                editingPlan={editingPlan}
                                onEditingPlanChange={(plan) => dispatch({ type: 'UPDATE_EDITING_PLAN', payload: plan })}
                            />
                        ) : loadingState.isAnalyzing ? (
                            <Spinner message={loadingState.message} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                                <Layers className="h-12 w-12 mb-4 text-muted-foreground/50"/>
                                <h3 className="font-semibold text-foreground">Style Deconstruction</h3>
                                <p className="text-sm">Upload a source image to begin the automated style analysis.</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Resizer Handle */}
                {!isSidebarCollapsed && (
                    <div
                        onMouseDown={handleMouseDown}
                        className="flex-shrink-0 w-1.5 cursor-col-resize bg-border/20 hover:bg-primary/50 transition-colors"
                        aria-label="Resize sidebar"
                    />
                )}
                

                {/* Main Content */}
                <div className="flex-grow p-4 flex flex-col gap-4 overflow-hidden relative">
                    <button onClick={toggleSidebar} className="absolute top-1/2 -left-3 -translate-y-1/2 bg-card border border-border rounded-full p-1 z-20 transition-all hover:bg-accent">
                        {isSidebarCollapsed ? <ChevronsRight className="h-4 w-4"/> : <ChevronsLeft className="h-4 w-4"/>}
                    </button>
                    
                    <div className="flex-shrink-0 flex items-center justify-between">
                         <h2 className="text-lg font-bold">Style Transfer Workspace</h2>
                         <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
                            <Button variant={layoutMode === 'vertical' ? 'default' : 'ghost'} size="sm" onClick={() => dispatch({type: 'SET_LAYOUT_MODE', payload: 'vertical'})} aria-label="Vertical Layout">
                                <Rows3 className="w-4 h-4"/>
                            </Button>
                            <Button variant={layoutMode === 'horizontal' ? 'default' : 'ghost'} size="sm" onClick={() => dispatch({type: 'SET_LAYOUT_MODE', payload: 'horizontal'})} aria-label="Horizontal Layout">
                                <Columns3 className="w-4 h-4"/>
                            </Button>
                         </div>
                    </div>

                    <ErrorDisplay message={error} onDismiss={() => dispatch({ type: 'DISMISS_ERROR' })} />
                    
                    {/* Scrollable Area */}
                    <div className="flex-grow overflow-y-auto min-h-0 -mr-4 pr-4">
                        <div className={`flex gap-4 ${layoutMode === 'vertical' ? 'flex-col' : 'flex-col lg:flex-row'}`}>
                            {/* Inputs Panel */}
                            <div className="flex flex-col gap-4 flex-1">
                                <h3 className="font-semibold text-center text-muted-foreground">Inputs</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 flex-grow gap-4 min-h-[45vh]">
                                    {/* Panel 1: Source */}
                                    <div className="flex flex-col gap-2 h-full">
                                        <h4 className="font-semibold text-xs text-muted-foreground text-center uppercase tracking-wider">1. Source (For Style)</h4>
                                        <div className="relative group flex-grow rounded-xl bg-black/20 flex items-center justify-center overflow-hidden border-2 border-dashed border-transparent">
                                            {sourceImage ? (
                                                <>
                                                    <LazyImage src={sourceImage.url} alt="Source" className="object-contain h-full w-full" />
                                                    <Button 
                                                        variant="secondary" 
                                                        size="icon" 
                                                        onClick={() => dispatch({ type: 'RESET_SOURCE' })}
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        aria-label="Clear Source Image"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <ImageUploader onImageUpload={handleSourceUpload} imageUrl={null} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Panel 2: Target Image */}
                                    <div className="flex flex-col gap-2 h-full">
                                        <h4 className="font-semibold text-xs text-muted-foreground text-center uppercase tracking-wider">2. Target (To Be Edited)</h4>
                                         <div className="relative group flex-grow rounded-xl bg-black/20 flex items-center justify-center overflow-hidden border-2 border-dashed border-transparent">
                                            {targetImage ? (
                                                <>
                                                    <LazyImage src={targetImage.url} alt="Target" className="object-contain h-full w-full" />
                                                    <Button 
                                                        variant="secondary" 
                                                        size="icon" 
                                                        onClick={() => dispatch({ type: 'RESET_TARGET' })}
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        aria-label="Clear Target Image"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <ImageUploader 
                                                    onImageUpload={handleTargetUpload} 
                                                    imageUrl={null} 
                                                    disabled={!sourceImage}
                                                    disabledText="Upload a source image first." 
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {loadingState.isDetectingConflicts && <Spinner message={loadingState.message} />}
                                {conflicts && conflicts.length > 0 && <ConflictDisplay conflicts={conflicts} />}
                            </div>


                            {/* Result Panel */}
                            <div className="flex flex-col gap-4 flex-1">
                                 <h3 className="font-semibold text-center text-muted-foreground">Result</h3>
                                <div className="w-full flex-grow bg-black/20 rounded-xl flex items-center justify-center relative p-2 min-h-[45vh]">
                                    {loadingState.isReplicating ? (
                                        <Spinner message={loadingState.message} />
                                    ) : finalImage ? (
                                        <div className="w-full h-full relative group flex items-center justify-center">
                                            <LazyImage src={finalImage.url} alt="Result" className="object-contain max-w-full max-h-full rounded-lg" />
                                            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="secondary" size="icon" onClick={() => dispatch({ type: 'SHOW_MODAL', payload: finalImage.url })} aria-label="Zoom"><Search className="h-4 w-4"/></Button>
                                                <Button variant="secondary" size="icon" onClick={() => setIsBlending(true)} aria-label="Mask & Blend"><Brush className="h-4 w-4"/></Button>
                                                <Button 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    onClick={() => dispatch({ type: 'UNDO_EDIT' })} 
                                                    disabled={resultHistory.length <= 1}
                                                    aria-label="Undo last edit"
                                                >
                                                    <RotateCcw className="h-4 w-4"/>
                                                </Button>
                                                <Button variant="secondary" size="icon" onClick={() => downloadBase64Image(finalImage.base64, finalImage.mimeType, 'artify-replicated.png')} aria-label="Download"><Download className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center p-4 text-sm">Your result will appear here.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Action Bar */}
                    <div className="flex-shrink-0 flex flex-col gap-4 bg-card border-t border-border p-4 -m-4 mt-auto">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <Button 
                                onClick={handleReplicate} 
                                disabled={!sourceImage || !targetImage || loadingState.isLoading}
                                className="w-full md:w-auto font-bold py-3"
                            >
                                <Layers className="w-5 h-5 mr-2" />
                                {loadingState.isReplicating ? 'Applying Style...' : 'Replicate Style'}
                            </Button>
                            <div className="w-full">
                                <AIAssistant 
                                    label={assistantLabel}
                                    onSendMessage={assistantAction}
                                    isLoading={loadingState.isReplicating || loadingState.isAnalyzing}
                                    placeholder={assistantPlaceholder}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};
