/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GoogleGenAI, Type, Modality, Chat } from '@google/genai';
import {
    analyzeImageStyle,
    extractColorPalette,
    describeImageContent,
    replicateStyle,
    editTextWithPrompt,
    generateImage,
    groundedSearch,
    startChat,
    sendMessage,
    detectConflicts
} from './geminiService';
import { aiKnowledgeBase } from './aiKnowledgeBase';
import type { EffectsAnalysisResponse } from '../types';

// Mock the entire @google/genai library
jest.mock('@google/genai', () => {
    const mockChat = {
        sendMessage: jest.fn(),
    };
    const mockModels = {
        generateContent: jest.fn(),
        generateImages: jest.fn(),
    };
    const mockChats = {
        create: jest.fn().mockReturnValue(mockChat),
    };
    const mockGoogleGenAI = {
        models: mockModels,
        chats: mockChats,
    };
    return {
        GoogleGenAI: jest.fn(() => mockGoogleGenAI),
        Type: {
            OBJECT: 'OBJECT',
            ARRAY: 'ARRAY',
            STRING: 'STRING',
            INTEGER: 'INTEGER',
            NUMBER: 'NUMBER',
        },
        Modality: {
            IMAGE: 'IMAGE',
        },
    };
});

// Create typed mocks for easier use
const mockedGoogleGenAI = new GoogleGenAI({ apiKey: 'mock-key' });
const mockedGenerateContent = mockedGoogleGenAI.models.generateContent as jest.Mock;
const mockedGenerateImages = mockedGoogleGenAI.models.generateImages as jest.Mock;
const mockedCreateChat = mockedGoogleGenAI.chats.create as jest.Mock;
const mockedSendMessage = (mockedCreateChat() as Chat).sendMessage as jest.Mock;


describe('geminiService', () => {
    beforeEach(() => {
        // Clear all mock history before each test
        jest.clearAllMocks();
    });

    describe('analyzeImageStyle', () => {
        const mockAnalysisResponse: EffectsAnalysisResponse = {
            identified_style: { category: 'Test', style: 'Test Style' },
            color_grading: {
                white_balance: { kelvin: 5000, tint: 10, details: 'Warm' },
                tone_curve: { type: 'S-Curve', points_description: 'Lifted shadows', details: 'Adds contrast' },
                hsl_adjustments: [],
                split_toning: { shadow_color_hex: '#0000FF', highlight_color_hex: '#FFFF00', balance: 0, details: 'Cinematic' },
            },
            exposure_and_contrast: {
                exposure: 0.5,
                contrast: 20,
                highlights: -10,
                shadows: 15,
                whites: 5,
                blacks: -5,
                clarity: 10,
                texture: 5,
            },
            texture_and_sharpness: {
                sharpening: { amount: 50, radius: 1, detail: 25, details: 'Standard sharpening' },
                grain: { amount: 10, size: 25, roughness: 50, details: 'Film grain effect' },
            },
            special_effects: {
                vignette: { amount: -20, midpoint: 50, roundness: 0, feather: 50, details: 'Darkens corners' },
                bokeh_blur: { amount: 0, type: 'None', details: 'No blur' },
            },
            lighting: {
                primary_light_direction: 'Front',
                light_quality: 'Soft',
                shadow_characteristics: 'Defined',
            },
            editing_plan: []
        };

        it('should call generateContent with gemini-2.5-flash and parse the response', async () => {
            const mockResponse = {
                text: JSON.stringify(mockAnalysisResponse)
            };
            mockedGenerateContent.mockResolvedValue(mockResponse);

            const result = await analyzeImageStyle('base64', 'image/png', false);

            expect(mockedGenerateContent).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-2.5-flash' }));
            expect(result.identified_style.style).toBe('Test Style');
            expect(result.exposure_and_contrast.contrast).toEqual(20);
        });

        it('should call generateContent with gemini-2.5-pro and thinkingConfig when useProModel is true', async () => {
            mockedGenerateContent.mockResolvedValue({ text: JSON.stringify(mockAnalysisResponse) });
            await analyzeImageStyle('base64', 'image/png', true);

            expect(mockedGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-2.5-pro',
                config: expect.objectContaining({
                    thinkingConfig: { thinkingBudget: 32768 }
                })
            }));
        });
    });

    describe('extractColorPalette', () => {
        it('should call generateContent and return a parsed array of hex codes', async () => {
            const mockResponse = { text: JSON.stringify(['#FFFFFF', '#000000']) };
            mockedGenerateContent.mockResolvedValue(mockResponse);

            const result = await extractColorPalette('base64', 'image/png');

            expect(mockedGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-2.5-flash'
            }));
            expect(result).toEqual(['#FFFFFF', '#000000']);
        });
    });

    describe('describeImageContent', () => {
        it('should call generateContent and return the text response', async () => {
            const mockResponse = { text: 'A cat sitting on a mat.' };
            mockedGenerateContent.mockResolvedValue(mockResponse);

            const result = await describeImageContent('base64', 'image/png');

            expect(mockedGenerateContent).toHaveBeenCalled();
            expect(result).toBe('A cat sitting on a mat.');
        });
    });

    describe('replicateStyle', () => {
        const mockAnalysis: Partial<EffectsAnalysisResponse> = { identified_style: { category: 'Test', style: 'Test' } };

        it('should call generateContent with the correct parts for a standard transfer', async () => {
            const mockResponse = { candidates: [{ content: { parts: [{ inlineData: { data: 'final-image-base64', mimeType: 'image/png' } }] } }] };
            mockedGenerateContent.mockResolvedValue(mockResponse);

            const result = await replicateStyle('target64', 'image/jpeg', mockAnalysis, null, null);

            expect(mockedGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-2.5-flash-image',
                config: { responseModalities: [Modality.IMAGE] }
            }));
            
            const { parts: calledParts } = mockedGenerateContent.mock.calls[0][0].contents;
            
            // Should have 4 parts for standard transfer: master instruction, analysis, target image label, target image data
            expect(calledParts).toHaveLength(4);
            expect(calledParts[0].text).toContain('**Workflow A: Standard Style Transfer**');
            expect(calledParts[1].text).toContain(JSON.stringify(mockAnalysis, null, 2));
            expect(calledParts[2].text).toBe('TARGET IMAGE (The image to be edited or have its subject extracted):');
            expect(calledParts[3]).toEqual({ inlineData: { data: 'target64', mimeType: 'image/jpeg' } });
            
            expect(result).toEqual({ base64: 'final-image-base64', mimeType: 'image/png' });
        });

        it('should include user instructions and source image for advanced compositing', async () => {
            mockedGenerateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ inlineData: { data: 'final-image-base64', mimeType: 'image/png' } }] } }] });
            
            const sourceImage = { base64: 'source64', mimeType: 'image/png' };
            const instructions = "use the source background";
            await replicateStyle('target64', 'image/jpeg', mockAnalysis, sourceImage, instructions);
            
            const { parts: calledParts } = mockedGenerateContent.mock.calls[0][0].contents;

            // 7 parts for advanced: instruction, analysis, user instructions label, user instructions, source label, source data, target label, target data
            expect(calledParts).toHaveLength(7);
            expect(calledParts[2].text).toContain(instructions);
            expect(calledParts[3].text).toContain('SOURCE IMAGE');
            expect(calledParts[4]).toEqual({ inlineData: { data: 'source64', mimeType: 'image/png' } });
        });
        
        it('should include editing_plan in the analysis part when provided', async () => {
            mockedGenerateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ inlineData: { data: 'final-image-base64', mimeType: 'image/png' } }] } }] });
            
            const analysisWithPlan: Partial<EffectsAnalysisResponse> = { 
                ...mockAnalysis, 
                editing_plan: ["Step 1", "Step 2"] 
            };
            await replicateStyle('target64', 'image/jpeg', analysisWithPlan, null, null);
            
            const { parts: calledParts } = mockedGenerateContent.mock.calls[0][0].contents;
            const analysisPartText = calledParts[1].text;
            expect(analysisPartText).toContain('"editing_plan":');
            expect(analysisPartText).toContain('"Step 1"');
        });
        
        it('should throw an error if the AI does not return an image', async () => {
            mockedGenerateContent.mockResolvedValue({ candidates: [] }); // No image in response
            await expect(replicateStyle('t', 't', mockAnalysis, null, null)).rejects.toThrow('The AI did not return a valid image for style replication. The response may have been empty or malformed.');
        });
    });

    describe('editTextWithPrompt', () => {
        it('should call generateContent with the image and prompt', async () => {
            const mockResponse = { candidates: [{ content: { parts: [{ inlineData: { data: 'edited-image-base64', mimeType: 'image/png' } }] } }] };
            mockedGenerateContent.mockResolvedValue(mockResponse);

            const result = await editTextWithPrompt('base64', 'image/png', 'make it pop');

            expect(mockedGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-2.5-flash-image'
            }));
            expect(result).toEqual({ base64: 'edited-image-base64', mimeType: 'image/png' });
        });

        it('should throw an error if no image is returned', async () => {
            mockedGenerateContent.mockResolvedValue({ candidates: [{ content: { parts: [] } }] });
            await expect(editTextWithPrompt('base64', 'image/png', 'prompt')).rejects.toThrow('The AI did not return a valid image for editing. The response may have been empty or malformed.');
        });
    });

    describe('generateImage', () => {
        it('should call generateImages with the correct model and config', async () => {
            const mockResponse = { generatedImages: [{ image: { imageBytes: 'generated-image-base64' } }] };
            mockedGenerateImages.mockResolvedValue(mockResponse);

            const result = await generateImage('a robot', '16:9');
            
            expect(mockedGenerateImages).toHaveBeenCalledWith({
                model: 'imagen-4.0-generate-001',
                prompt: 'a robot',
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            });
            expect(result).toBe('generated-image-base64');
        });
        
        it('should throw an error if no image is generated', async () => {
            mockedGenerateImages.mockResolvedValue({});
            await expect(generateImage('prompt', '1:1')).rejects.toThrow('The AI did not generate an image.');
        });
    });

    describe('groundedSearch', () => {
        it('should call generateContent and process grounding metadata', async () => {
            const mockResponse = {
                text: 'The winner is...',
                candidates: [{
                    groundingMetadata: {
                        groundingChunks: [
                            { web: { uri: 'http://a.com', title: 'A' } },
                            { web: { uri: 'http://b.com', title: 'B' } },
                            { web: { uri: 'http://a.com', title: 'A Duplicate' } } // Should be deduplicated
                        ]
                    }
                }]
            };
            mockedGenerateContent.mockResolvedValue(mockResponse);

            const result = await groundedSearch('who won?');

            expect(mockedGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                config: { tools: [{googleSearch: {}}] }
            }));
            expect(result.text).toBe('The winner is...');
            expect(result.sources).toEqual([
                { uri: 'http://a.com', title: 'A' },
                { uri: 'http://b.com', title: 'B' }
            ]);
            expect(result.sources.length).toBe(2);
        });
        
        it('should handle responses with no grounding metadata', async () => {
            mockedGenerateContent.mockResolvedValue({ text: 'No sources found.' });
            
            const result = await groundedSearch('query');
            expect(result.text).toBe('No sources found.');
            expect(result.sources).toEqual([]);
        });
    });

    describe('Chat Service', () => {
        describe('startChat', () => {
            it('should call chats.create with the correct model and system instruction', () => {
                const chat = startChat();
                expect(mockedCreateChat).toHaveBeenCalledWith({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: expect.any(String)
                    }
                });
                expect(chat).toBeDefined();
            });
        });

        describe('sendMessage', () => {
            it('should call chat.sendMessage and return the response text', async () => {
                const mockChat = startChat();
                mockedSendMessage.mockResolvedValue({ text: 'Hello from the AI!' });
                
                const response = await sendMessage(mockChat, 'Hello');

                expect(mockedSendMessage).toHaveBeenCalledWith({ message: 'Hello' });
                expect(response).toBe('Hello from the AI!');
            });
        });
    });
});
