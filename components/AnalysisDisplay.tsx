import React, { useState } from 'react';
import type { EffectsAnalysisResponse } from '../types';
import { ColorPalette } from './ColorPalette';
import { Plus, Trash2, ChevronDown, Check } from 'lucide-react';

// --- HELPER COMPONENTS ---

const AnalysisSection: React.FC<{ title: string; children: React.ReactNode; isActive: boolean; onToggle: () => void; isToggleable: boolean }> = ({ title, children, isActive, onToggle, isToggleable }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className={`bg-background p-3 rounded-lg border transition-opacity ${isActive ? 'opacity-100 border-border' : 'opacity-40 border-border/50'}`}>
            <div className="flex items-center gap-3">
                {isToggleable && (
                     <button
                        onClick={onToggle}
                        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isActive ? 'bg-primary border-primary' : 'bg-secondary border-border'}`}
                        aria-label={isActive ? `Disable ${title}` : `Enable ${title}`}
                    >
                        {isActive && <Check className="h-4 w-4 text-primary-foreground" />}
                    </button>
                )}
                <div className="flex-grow cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <p className="font-semibold text-foreground">{title}</p>
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-muted-foreground hover:text-foreground">
                    <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {isExpanded && (
                <div className="mt-3 pl-8 space-y-2 border-l border-border ml-2.5">
                    {children}
                </div>
            )}
        </div>
    );
};

const Param: React.FC<{ label: string; value: string | number | React.ReactNode; unit?: string }> = ({ label, value, unit }) => (
    <div className="text-xs grid grid-cols-2 gap-2 items-center">
        <p className="font-semibold text-muted-foreground">{label}:</p>
        <p className="text-foreground/90 font-medium text-right">{value} {unit}</p>
    </div>
);

const Detail: React.FC<{ text: string }> = ({ text }) => <p className="text-xs text-foreground/80 italic pt-1">"{text}"</p>;


// --- DISPLAY SECTIONS ---

const ColorGradingDisplay: React.FC<{ data: EffectsAnalysisResponse['color_grading'] }> = ({ data }) => (
    <>
        <Param label="White Balance" value={`${data.white_balance.kelvin}K / ${data.white_balance.tint > 0 ? '+' : ''}${data.white_balance.tint}`} />
        <Detail text={data.white_balance.details} />
        <Param label="Tone Curve" value={data.tone_curve.type} />
        <Detail text={data.tone_curve.points_description} />
        <Param label="Split Toning" value="Shadows/Highlights" />
        <div className="flex items-center gap-2 justify-end">
            <div className="w-4 h-4 rounded-sm border" style={{backgroundColor: data.split_toning.shadow_color_hex}}></div>
            <div className="w-4 h-4 rounded-sm border" style={{backgroundColor: data.split_toning.highlight_color_hex}}></div>
        </div>
        <Detail text={data.split_toning.details} />
        {data.hsl_adjustments.map(hsl => (
            <div key={hsl.color_channel} className="text-xs pt-1">
                <p className="font-semibold text-muted-foreground">{hsl.color_channel} Adjustments:</p>
                <div className="grid grid-cols-3 text-center text-foreground/80 mt-1">
                    <span>H: {hsl.hue_shift}</span>
                    <span>S: {hsl.saturation_shift}</span>
                    <span>L: {hsl.luminance_shift}</span>
                </div>
            </div>
        ))}
    </>
);

const ExposureDisplay: React.FC<{ data: EffectsAnalysisResponse['exposure_and_contrast'] }> = ({ data }) => (
     <>
        <Param label="Exposure" value={data.exposure > 0 ? `+${data.exposure.toFixed(2)}` : data.exposure.toFixed(2)} unit="stops"/>
        <Param label="Contrast" value={data.contrast} />
        <Param label="Highlights" value={data.highlights} />
        <Param label="Shadows" value={data.shadows} />
        <Param label="Whites" value={data.whites} />
        <Param label="Blacks" value={data.blacks} />
        <Param label="Clarity" value={data.clarity} />
        <Param label="Texture" value={data.texture} />
    </>
);

const TextureDisplay: React.FC<{ data: EffectsAnalysisResponse['texture_and_sharpness'] }> = ({ data }) => (
    <>
        <Param label="Sharpening Amount" value={data.sharpening.amount} />
        <Detail text={data.sharpening.details} />
        <Param label="Grain Amount" value={data.grain.amount} />
        <Detail text={data.grain.details} />
    </>
);

const EffectsDisplay: React.FC<{ data: EffectsAnalysisResponse['special_effects'] }> = ({ data }) => (
    <>
        <Param label="Vignette Amount" value={data.vignette.amount} />
        <Detail text={data.vignette.details} />
        <Param label="Bokeh Amount" value={data.bokeh_blur.amount} />
        <Detail text={data.bokeh_blur.details} />
    </>
);

const LightingDisplay: React.FC<{ data: EffectsAnalysisResponse['lighting'] }> = ({ data }) => (
    <>
        <Param label="Light Direction" value={data.primary_light_direction} />
        <Param label="Light Quality" value={data.light_quality} />
        <Param label="Shadows" value={data.shadow_characteristics} />
    </>
);


const EditableEditingPlan: React.FC<{ plan: string[] | null; onPlanChange: (newPlan: string[]) => void; readOnly?: boolean; }> = ({ plan, onPlanChange, readOnly = false }) => {
    if (plan === null || plan.length === 0) return null;

    const handleStepChange = (index: number, value: string) => {
        const newPlan = [...plan];
        newPlan[index] = value;
        onPlanChange(newPlan);
    };

    const handleAddStep = () => {
        onPlanChange([...plan, "New step..."]);
    };

    const handleDeleteStep = (index: number) => {
        onPlanChange(plan.filter((_, i) => i !== index));
    };

    return (
        <div className="my-2">
            <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">{readOnly ? 'High-Level Editing Plan' : 'Interactive Editing Plan'}</h4>
            <div className="bg-background p-3 rounded-lg border border-border text-sm space-y-2">
                {plan.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="text-muted-foreground font-semibold">{index + 1}.</span>
                        <input
                            type="text"
                            value={step}
                            onChange={(e) => handleStepChange(index, e.target.value)}
                            className="w-full bg-input border border-border rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-ring focus:outline-none transition disabled:bg-background disabled:cursor-default"
                            readOnly={readOnly}
                            disabled={readOnly}
                        />
                        {!readOnly && (
                            <button onClick={() => handleDeleteStep(index)} className="text-muted-foreground hover:text-destructive p-1" aria-label={`Delete step ${index + 1}`}>
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ))}
                {!readOnly && (
                    <button onClick={handleAddStep} className="text-sm text-primary font-semibold hover:underline mt-2 flex items-center gap-1">
                        <Plus className="h-4 w-4"/> Add Step
                    </button>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

interface AnalysisDisplayProps {
    analysis: EffectsAnalysisResponse | null;
    palette: string[] | null;
    paletteTitle?: string;
    activeSections: Set<string>;
    onToggleSection: (section: string) => void;
    editingPlan: string[] | null;
    onEditingPlanChange: (newPlan: string[]) => void;
    isPlanEditable?: boolean;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, palette, paletteTitle = "Color Palette", activeSections, onToggleSection, editingPlan, onEditingPlanChange, isPlanEditable = true }) => {
    const isToggleable = isPlanEditable;

    const sections = analysis ? [
        { id: 'color_grading', title: 'Color Grading', component: <ColorGradingDisplay data={analysis.color_grading} /> },
        { id: 'exposure_and_contrast', title: 'Exposure & Contrast', component: <ExposureDisplay data={analysis.exposure_and_contrast} /> },
        { id: 'texture_and_sharpness', title: 'Texture & Sharpness', component: <TextureDisplay data={analysis.texture_and_sharpness} /> },
        { id: 'special_effects', title: 'Special Effects', component: <EffectsDisplay data={analysis.special_effects} /> },
        { id: 'lighting', title: 'Lighting', component: <LightingDisplay data={analysis.lighting} /> },
    ] : [];

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="font-bold text-lg">Source Deconstruction</h3>
            </div>
            {analysis ? (
                 <div className="space-y-2">
                     <EditableEditingPlan plan={editingPlan} onPlanChange={onEditingPlanChange} readOnly={!isPlanEditable} />
                     <ColorPalette palette={palette} title={paletteTitle} />
                     
                     <div className="my-2">
                        <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Technical Breakdown</h4>
                        <div className='space-y-2'>
                            {sections.map(section => (
                                <AnalysisSection
                                    key={section.id}
                                    title={section.title}
                                    isActive={activeSections.has(section.id)}
                                    onToggle={() => onToggleSection(section.id)}
                                    isToggleable={isToggleable}
                                >
                                    {section.component}
                                </AnalysisSection>
                            ))}
                        </div>
                     </div>
               </div>
            ) : (
                <div className="flex items-center justify-center text-muted-foreground text-center py-8">
                    <p>Analyzed effects will be displayed here.</p>
                </div>
            )}
        </div>
    );
};
