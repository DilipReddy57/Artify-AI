
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import type { EffectsAnalysisResponse, GroundedSearchResult, ConflictInfo } from '../types';
import { aiKnowledgeBase } from './aiKnowledgeBase';

let aiInstance: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (aiInstance) return aiInstance;

    // Note: process.env.API_KEY is replaced by Vite at build time.
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        throw new Error("API Key is missing. Please set GEMINI_API_KEY in your environment or configuration.");
    }

    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
};

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
};

// --- NEW DETAILED ANALYSIS SCHEMA ---

const identifiedStyleSchema = {
    type: Type.OBJECT,
    properties: {
        category: { type: Type.STRING, description: "The primary category from the knowledge base (e.g., 'Portrait Photography')." },
        style: { type: Type.STRING, description: "The specific named style from the knowledge base (e.g., 'Dark and Moody')." }
    },
    required: ["category", "style"]
};

const colorGradingSchema = {
    type: Type.OBJECT,
    properties: {
        white_balance: {
            type: Type.OBJECT,
            properties: {
                kelvin: { type: Type.INTEGER, description: "Color temperature in Kelvin (e.g., 3500 for warm, 7500 for cool)." },
                tint: { type: Type.INTEGER, description: "Magenta-Green shift (-100 to +100)." },
                details: { type: Type.STRING, description: "Brief explanation of the white balance choice."}
            },
            required: ["kelvin", "tint", "details"]
        },
        tone_curve: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "Shape of the curve (e.g., 'S-Curve', 'Linear', 'Lifted Blacks')." },
                points_description: { type: Type.STRING, description: "A simplified description of the curve's adjustments (e.g., 'Slightly lifted shadows, boosted midtones, compressed highlights')." },
                details: { type: Type.STRING, description: "Brief explanation of the curve's impact on the image."}
            },
            required: ["type", "points_description", "details"]
        },
        hsl_adjustments: {
            type: Type.ARRAY,
            description: "Adjustments for major color channels. Only include channels that are significantly adjusted.",
            items: {
                type: Type.OBJECT,
                properties: {
                    color_channel: { type: Type.STRING, description: "The color being adjusted (e.g., 'Reds', 'Greens', 'Blues')." },
                    hue_shift: { type: Type.INTEGER, description: "Hue shift (-180 to 180)." },
                    saturation_shift: { type: Type.INTEGER, description: "Saturation shift (-100 to 100)." },
                    luminance_shift: { type: Type.INTEGER, description: "Luminance shift (-100 to 100)." },
                },
                required: ["color_channel", "hue_shift", "saturation_shift", "luminance_shift"]
            }
        },
        split_toning: {
            type: Type.OBJECT,
            properties: {
                shadow_color_hex: { type: Type.STRING, description: "The hex code of the color tint applied to shadows." },
                highlight_color_hex: { type: Type.STRING, description: "The hex code of the color tint applied to highlights." },
                balance: { type: Type.INTEGER, description: "The balance between shadows and highlights (-100 to 100)." },
                details: { type: Type.STRING, description: "Brief explanation of the split toning effect."}
            },
            required: ["shadow_color_hex", "highlight_color_hex", "balance", "details"]
        }
    },
    required: ["white_balance", "tone_curve", "hsl_adjustments", "split_toning"]
};

const exposureAndContrastSchema = {
    type: Type.OBJECT,
    properties: {
        exposure: { type: Type.NUMBER, description: "Overall exposure adjustment in stops (e.g., -0.5, 0.0, +1.2)." },
        contrast: { type: Type.INTEGER, description: "Global contrast adjustment (-100 to 100)." },
        highlights: { type: Type.INTEGER, description: "Adjustment for bright areas (-100 to 100)." },
        shadows: { type: Type.INTEGER, description: "Adjustment for dark areas (-100 to 100)." },
        whites: { type: Type.INTEGER, description: "White point adjustment (-100 to 100)." },
        blacks: { type: Type.INTEGER, description: "Black point adjustment (-100 to 100)." },
        clarity: { type: Type.INTEGER, description: "Mid-tone contrast enhancement (-100 to 100)." },
        texture: { type: Type.INTEGER, description: "Fine detail enhancement (-100 to 100)." },
    },
    required: ["exposure", "contrast", "highlights", "shadows", "whites", "blacks", "clarity", "texture"]
};

const textureAndSharpnessSchema = {
    type: Type.OBJECT,
    properties: {
        sharpening: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.INTEGER, description: "Strength of sharpening (0-150)." },
                radius: { type: Type.NUMBER, description: "Size of sharpened edges in pixels (0.5-3.0)." },
                detail: { type: Type.INTEGER, description: "Fine vs coarse edge emphasis (0-100)." },
                details: { type: Type.STRING, description: "Brief explanation of sharpening choices."}
            },
            required: ["amount", "radius", "detail", "details"]
        },
        grain: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.INTEGER, description: "Intensity of grain (0-100)." },
                size: { type: Type.INTEGER, description: "Size of grain particles (0-100)." },
                roughness: { type: Type.INTEGER, description: "Regularity of grain (0-100)." },
                details: { type: Type.STRING, description: "Brief explanation of grain effect (e.g., 'emulates Kodak Portra 400')."}
            },
            required: ["amount", "size", "roughness", "details"]
        }
    },
    required: ["sharpening", "grain"]
};

const specialEffectsSchema = {
    type: Type.OBJECT,
    properties: {
        vignette: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.INTEGER, description: "Intensity of edge darkening/brightening (-100 to 100)." },
                midpoint: { type: Type.INTEGER, description: "Size of the vignette's center (0-100)." },
                roundness: { type: Type.INTEGER, description: "Shape of the vignette (-100 to 100)." },
                feather: { type: Type.INTEGER, description: "Softness of the vignette's edge (0-100)." },
                details: { type: Type.STRING, description: "Brief explanation of the vignette's purpose."}
            },
            required: ["amount", "midpoint", "roundness", "feather", "details"]
        },
        bokeh_blur: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.INTEGER, description: "Intensity of background blur (0-100). 0 if not present." },
                type: { type: Type.STRING, description: "Type of blur (e.g., 'Natural Lens Bokeh', 'Gaussian', 'Motion'). 'None' if not present." },
                details: { type: Type.STRING, description: "Description of the out-of-focus areas."}
            },
            required: ["amount", "type", "details"]
        }
    },
    required: ["vignette", "bokeh_blur"]
};

const lightingSchema = {
    type: Type.OBJECT,
    properties: {
        primary_light_direction: { type: Type.STRING, description: "Direction of the main light source (e.g., 'Front-left', 'Backlit', 'Overhead')." },
        light_quality: { type: Type.STRING, description: "Quality of the light ('Hard', 'Soft', 'Diffused', 'Mixed')." },
        shadow_characteristics: { type: Type.STRING, description: "Description of the shadows (e.g., 'Long and soft', 'Short and defined', 'Deep with minimal detail')." }
    },
    required: ["primary_light_direction", "light_quality", "shadow_characteristics"]
};

const effectsAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    identified_style: identifiedStyleSchema,
    color_grading: colorGradingSchema,
    exposure_and_contrast: exposureAndContrastSchema,
    texture_and_sharpness: textureAndSharpnessSchema,
    special_effects: specialEffectsSchema,
    lighting: lightingSchema,
    editing_plan: { 
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "For complex images, provide a high-level, step-by-step editing plan. Omit if not needed."
    }
  },
  required: ["identified_style", "color_grading", "exposure_and_contrast", "texture_and_sharpness", "special_effects", "lighting"]
};


export const analyzeImageStyle = async (imageBase64: string, mimeType: string, useProModel: boolean): Promise<EffectsAnalysisResponse> => {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    
    const prompt = `You are Artify AI, an expert photo editor. Your task is to perform a deep, technical deconstruction of the provided image's editing style.
    
    1.  **Style Identification:** First, consult the provided KNOWLEDGE BASE (SECTION 1) to determine the correct 'category' and 'style'. This is your primary classification.
    2.  **Technical Deconstruction:** Second, analyze the image and populate the rest of the JSON schema with precise parameters. Be objective and technical. Quantify settings where possible.
    
    Your entire response must be a single JSON object matching the provided schema.`;

    // UPDATED: Use Gemini 3.0 Pro Preview for complex analysis when enabled
    const model = useProModel ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
    
    const response = await getAiClient().models.generateContent({
        model,
        contents: { parts: [{ text: aiKnowledgeBase }, { text: prompt }, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: effectsAnalysisSchema,
            // Thinking budget max is 32768 for gemini-3-pro-preview
            ...(useProModel && { thinkingConfig: { thinkingBudget: 32768 } })
        }
    });

    return JSON.parse(response.text) as EffectsAnalysisResponse;
};


export const extractColorPalette = async (imageBase64: string, mimeType: string): Promise<string[]> => {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const prompt = "Extract the 5 most dominant and representative colors from this image. Return them as a JSON array of hex code strings. Example: [\"#FFFFFF\", \"#000000\"].";

    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    
    return JSON.parse(response.text);
};

export const describeImageContent = async (imageBase64: string, mimeType: string): Promise<string> => {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const prompt = "Briefly describe the main subject and setting of this image in one or two sentences for a user-friendly display.";

    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] }
    });

    return response.text;
};

// --- NEW CONFLICT DETECTION SERVICE ---

const conflictInfoSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The unique name of the conflict (e.g., 'poster_to_photo')." },
        severity: { type: Type.STRING, description: "The severity level ('HIGH', 'MEDIUM', 'LOW')." },
        approach: { type: Type.STRING, description: "The suggested approach to handle the conflict (e.g., 'EXTRACT_AMBIENT_MOOD_ONLY')." },
        description: { type: Type.STRING, description: "A user-friendly description of the detected conflict." }
    },
    required: ["name", "severity", "approach", "description"]
};

const conflictDetectionSchema = {
    type: Type.ARRAY,
    items: conflictInfoSchema
};


export const detectConflicts = async (sourceBase64: string, sourceMimeType: string, targetBase64: string, targetMimeType: string): Promise<ConflictInfo[]> => {
    const sourceImagePart = fileToGenerativePart(sourceBase64, sourceMimeType);
    const targetImagePart = fileToGenerativePart(targetBase64, targetMimeType);
    
    const prompt = `You are Artify AI's Conflict Detector. Your task is to analyze the Source Image and the Target Image to identify potential style transfer conflicts.

    1.  **Analyze Both Images:** Carefully examine the content, composition, and type of each image.
    2.  **Consult Knowledge Base:** Use **SECTION 3: CONFLICT DETECTION GUIDE** from the knowledge base to identify all applicable conflicts.
        - Pay special attention to **Genre Mismatches** (e.g., Illustration vs. Realistic Photo).
        - Check for **Aspect Ratio Mismatches** that might cut off important elements.
        - Check for **Type Mismatches** (e.g., Poster vs Photo).
    3.  **Return Conflicts:** Respond with a JSON array of all detected conflicts, sorted by severity (HIGH first). If no conflicts are found, return an empty array.

    Your entire response must be a single JSON object matching the provided schema.`;

    // UPGRADE: Use Gemini 3.0 Pro for nuanced conflict reasoning
    const response = await getAiClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { text: aiKnowledgeBase },
                { text: prompt },
                { text: "SOURCE IMAGE:" },
                sourceImagePart,
                { text: "TARGET IMAGE:" },
                targetImagePart
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: conflictDetectionSchema,
            thinkingConfig: { thinkingBudget: 16000 } // Allocate thinking budget for complex conflict analysis
        }
    });
    
    return JSON.parse(response.text) as ConflictInfo[];
};


// Helper to process responses that should contain an image
const processImageResponse = (response: any, functionNameForError: string): { base64: string, mimeType: string } => {
    // Check for safety blocks first
    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
        throw new Error(`Request blocked for safety reasons (${blockReason}). Try adjusting your prompt or image.`);
    }

    // Find the image part in the response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart?.inlineData?.data && imagePart?.inlineData?.mimeType) {
        return { base64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType };
    }

    // If no image, check for a text response from the model (e.g., a refusal to generate)
    const textResponse = response.text; // .text is a convenient getter for the first text part
    if (textResponse) {
        throw new Error(`The AI gave a text response instead of an image: "${textResponse}"`);
    }

    // Fallback error if the response is empty or malformed
    throw new Error(`The AI did not return a valid image for ${functionNameForError}. The response may have been empty or malformed.`);
};

export const replicateStyle = async (
    targetImageBase64: string,
    targetMimeType: string,
    analysis: Partial<EffectsAnalysisResponse>,
    sourceImage: { base64: string; mimeType: string } | null,
    instructions: string | null
): Promise<{ base64: string; mimeType: string }> => {
    const targetImagePart = fileToGenerativePart(targetImageBase64, targetMimeType);
    const sourceImagePart = sourceImage ? fileToGenerativePart(sourceImage.base64, sourceImage.mimeType) : null;

    const masterInstruction = `
        You are an expert AI photo editor. Your task is to apply a specific aesthetic style to the provided Target Image.
        
        **CRITICAL: First, analyze the user's instructions to determine the operational workflow.**

        **Workflow A: Standard Style Transfer**
        -   **Trigger:** If the user's instructions are empty, null, or only contain aesthetic guidance (e.g., "make it brighter", "more contrast", "use the colors").
        -   **Execution:**
            1.  Use the provided **Technical JSON Analysis** as a "recipe" to edit the Target Image.
            2.  **ABSOLUTE RULE:** Preserve the Target Image's original subject and composition perfectly. DO NOT add, remove, or change content.
            3.  **ASPECT RATIO:** The output image MUST have the exact same aspect ratio as the Target Image.

        **Workflow B: Advanced Compositing & Context-Based Learning**
        -   **Trigger:** If the user's instructions contain content-related requests (e.g., "use the source background", "put the target character in the source scene", "add the text from the source").
        -   **Execution:**
            1.  **Context Analysis (Context-Based Learning):** Deeply understand the lighting direction, perspective, and semantic context of both images. Does the source have soft window light? Is the target outdoors?
            2.  **Isolate Subject:** Perfectly identify and isolate the main subject(s) from the **Target Image**.
            3.  **Recreate Scene:** Analyze the **Source Image** and the **Technical JSON Analysis** to recreate its scene (background, texture, overlays like text or borders).
            4.  **Context-Aware Integration:** Place the isolated Target Subject into the newly recreated scene. 
                -   **Lighting Match:** Seamlessly blend the lighting on the subject to match the new background's light sources.
                -   **Shadow Generation:** Generate realistic drop shadows or contact shadows based on the scene's light direction.
            5.  **Intelligent Doodle & Element Distribution:** If the source style involves doodles, stickers, or text overlays:
                -   **Safe Zones:** Identify "negative space" in the composition (e.g., empty walls, sky, blurred background). Place elements ONLY here.
                -   **Face Avoidance:** STRICTLY avoid placing any doodles, text, or stickers over human faces or key subject details. This is a hard constraint.
                -   **Visual Balance:** Scale, rotate, and distribute elements to guide the viewer's eye without cluttering the subject. Ensure elements are proportional to the subject size.
            6.  **ASPECT RATIO & FILL:** If the user requests the source's aspect ratio, or if there is a mismatch, use Generative Fill to extend the background naturally, ensuring no white borders or stretched pixels.

        **Your entire response must be the final edited image.**
    `;

    const analysisPart = { text: `Technical Style Analysis JSON (Your "Recipe"):\n${JSON.stringify(analysis, null, 2)}` };
    
    const contents: any = { parts: [] };
    contents.parts.push({ text: masterInstruction });
    contents.parts.push(analysisPart);

    if (instructions) {
        contents.parts.push({ text: `User Instructions (For workflow selection and guidance):\n"${instructions}"` });
    }
    
    if (sourceImagePart) {
        contents.parts.push({ text: "SOURCE IMAGE (For context in Advanced Compositing):" });
        contents.parts.push(sourceImagePart);
    }

    contents.parts.push({ text: "TARGET IMAGE (The image to be edited or have its subject extracted):" });
    contents.parts.push(targetImagePart);

    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: contents,
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });

    try {
        return processImageResponse(response, 'style replication');
    } catch (e) {
        console.error("Error processing replicateStyle response:", e);
        console.error("Full API response from replicateStyle:", JSON.stringify(response, null, 2));
        throw e;
    }
};

export const editTextWithPrompt = async (imageBase64: string, mimeType: string, prompt: string): Promise<{ base64: string, mimeType: string }> => {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const promptPart = { text: prompt };

    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, promptPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });
    
    try {
        // Use the new robust response processor
        return processImageResponse(response, 'editing');
    } catch (e) {
        console.error("Error processing editTextWithPrompt response:", e);
        // Add full response logging for debugging
        console.error("Full API response from editTextWithPrompt:", JSON.stringify(response, null, 2));
        throw e; // Re-throw for the UI to catch
    }
};

export const editTextWithMaskAndPrompt = async (
    imageBase64: string, 
    mimeType: string, 
    maskBase64: string, 
    maskMimeType: string,
    prompt: string
): Promise<{ base64: string, mimeType: string }> => {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const maskPart = fileToGenerativePart(maskBase64, maskMimeType);
    
    const instructionPrompt = `You will be provided with three parts: an original image, a mask image (black and white), and a text prompt.
Your task is to apply the edit described in the text prompt *only* to the white areas of the mask on the original image.
The black areas of the mask should remain completely untouched from the original image.
Ensure the final output is a seamless blend and preserves the original image's aspect ratio.

Text Prompt: "${prompt}"
`;
    const promptPart = { text: instructionPrompt };

    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [promptPart, imagePart, maskPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });
    
    try {
        return processImageResponse(response, 'masked editing');
    } catch (e) {
        console.error("Error processing editTextWithMaskAndPrompt response:", e);
        console.error("Full API response from editTextWithMaskAndPrompt:", JSON.stringify(response, null, 2));
        throw e;
    }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const response = await getAiClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
    });

    const image = response.generatedImages?.[0]?.image?.imageBytes;
    if (!image) {
        throw new Error("The AI did not generate an image.");
    }
    // New check: Ensure the image string is not empty
    if (image.trim().length === 0) {
        throw new Error("The AI generated an empty image string.");
    }
    return image;
};


export const groundedSearch = async (query: string): Promise<GroundedSearchResult> => {
    const response = await getAiClient().models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
            tools: [{googleSearch: {}}],
        },
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundedSearchResult['sources'] = groundingChunks
        .filter(chunk => chunk.web && chunk.web.uri)
        .map(chunk => ({
            uri: chunk.web!.uri!,
            title: chunk.web!.title || ''
        }))
        .filter((source, index, self) =>
            index === self.findIndex((s) => s.uri === source.uri)
        );

    return {
        text: response.text,
        sources,
    };
};


// --- CHAT SERVICE ---
export const startChat = (): Chat => {
    return getAiClient().chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are a friendly and helpful AI assistant for Artify AI, a photo editing application. You can answer questions about photo editing concepts, suggest creative ideas, or have a general conversation. Keep your answers concise and helpful."
        },
    });
};

export const sendMessage = async (chat: Chat, message: string): Promise<string> => {
    const response = await chat.sendMessage({ message });
    return response.text;
};
