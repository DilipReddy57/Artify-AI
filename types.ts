// Shared types for the application

// Style Analysis - NEW STRUCTURE
export interface IdentifiedStyle {
  category: string;
  style: string;
}

export interface ColorGradingAnalysis {
  white_balance: { kelvin: number; tint: number; details: string };
  tone_curve: { type: string; points_description: string; details: string };
  hsl_adjustments: { color_channel: string; hue_shift: number; saturation_shift: number; luminance_shift: number; }[];
  split_toning: { shadow_color_hex: string; highlight_color_hex: string; balance: number; details: string };
}

export interface ExposureAndContrastAnalysis {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  clarity: number;
  texture: number;
}

export interface TextureAndSharpnessAnalysis {
  sharpening: { amount: number; radius: number; detail: number; details: string };
  grain: { amount: number; size: number; roughness: number; details: string };
}

export interface SpecialEffectsAnalysis {
  vignette: { amount: number; midpoint: number; roundness: number; feather: number; details: string };
  bokeh_blur: { amount: number; type: string; details: string };
}

export interface LightingAnalysis {
    primary_light_direction: string;
    light_quality: 'Hard' | 'Soft' | 'Diffused' | 'Mixed';
    shadow_characteristics: string;
}

export interface EffectsAnalysisResponse {
  identified_style: IdentifiedStyle;
  color_grading: ColorGradingAnalysis;
  exposure_and_contrast: ExposureAndContrastAnalysis;
  texture_and_sharpness: TextureAndSharpnessAnalysis;
  special_effects: SpecialEffectsAnalysis;
  lighting: LightingAnalysis;
  editing_plan?: string[];
}

// Inspiration Gallery
export interface Inspiration {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    prompt: string;
}

// View Initial Props
export interface StyleTransferInitialProps {
  sourceImageUrl: string;
  sourceImageName: string;
}

export interface ImageGenerationInitialProps {
    prompt?: string;
}

// Grounded Search
export interface GroundedSearchResult {
    text: string;
    sources: { uri: string; title: string; }[];
}

// Conflict Detection
export interface ConflictInfo {
  name: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  approach: string;
  description: string;
}