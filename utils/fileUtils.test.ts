/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { fileToBase64, downloadBase64Image, fetchImageAsBase64 } from './fileUtils';

describe('fileUtils', () => {
    // Hold original implementations
    const originalFileReader = window.FileReader;
    const originalCreateElement = document.createElement;
    const originalFetch = window.fetch;

    // Mocks
    const mockFileReaderInstance = {
        readAsDataURL: jest.fn(),
        onload: null as (() => void) | null,
        onerror: null as ((e: any) => void) | null,
        onloadend: null as (() => void) | null,
        result: '',
    };
    const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
    };
    
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        mockFileReaderInstance.result = '';
        
        // Mock FileReader
        window.FileReader = jest.fn(() => mockFileReaderInstance) as any;
        
        // Mock DOM element creation
        document.createElement = jest.fn((tag: string) => {
            if (tag === 'a') {
                return mockLink as any;
            }
            return originalCreateElement.call(document, tag);
        });
        jest.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as Node));
        jest.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as Node));
        
        // Mock fetch
        window.fetch = jest.fn();
    });

    afterEach(() => {
        // Restore originals
        window.FileReader = originalFileReader;
        document.createElement = originalCreateElement;
        window.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    describe('fileToBase64', () => {
        it('should convert a file to base64 successfully', async () => {
            const file = new File(['test'], 'test.png', { type: 'image/png' });
            const promise = fileToBase64(file);

            // Simulate successful file read
            mockFileReaderInstance.result = 'data:image/png;base64,dGVzdA==';
            if (mockFileReaderInstance.onload) {
                mockFileReaderInstance.onload();
            }

            const result = await promise;
            expect(mockFileReaderInstance.readAsDataURL).toHaveBeenCalledWith(file);
            expect(result).toEqual({ base64: 'dGVzdA==', mimeType: 'image/png' });
        });

        it('should reject the promise on a file read error', async () => {
            const file = new File(['test'], 'test.png', { type: 'image/png' });
            const promise = fileToBase64(file);
            const error = new Error('File read failed');

            // Simulate file read error
             if (mockFileReaderInstance.onerror) {
                mockFileReaderInstance.onerror(error);
            }

            await expect(promise).rejects.toBe(error);
        });
    });

    describe('downloadBase64Image', () => {
        it('should create an anchor element and trigger a download', () => {
            downloadBase64Image('dGVzdA==', 'image/png', 'test.png');

            expect(document.createElement).toHaveBeenCalledWith('a');
            expect(mockLink.href).toBe('data:image/png;base64,dGVzdA==');
            expect(mockLink.download).toBe('test.png');
            expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
            expect(mockLink.click).toHaveBeenCalledTimes(1);
            expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
        });
    });

    describe('fetchImageAsBase64', () => {
        it('should fetch an image and convert it to base64', async () => {
            const imageUrl = 'http://example.com/image.jpg';
            const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });
            
            (window.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
            });

            const promise = fetchImageAsBase64(imageUrl);

            // Simulate successful file read from the fetched blob
            mockFileReaderInstance.result = 'data:image/jpeg;base64,aW1hZ2UgZGF0YQ==';
            if (mockFileReaderInstance.onloadend) {
                mockFileReaderInstance.onloadend();
            }

            const result = await promise;

            expect(window.fetch).toHaveBeenCalledWith(imageUrl);
            expect(mockFileReaderInstance.readAsDataURL).toHaveBeenCalledWith(mockBlob);
            expect(result).toEqual({ base64: 'aW1hZ2UgZGF0YQ==', mimeType: 'image/jpeg' });
        });

        it('should throw an error if the fetch response is not ok', async () => {
            (window.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 404,
            });

            await expect(fetchImageAsBase64('http://example.com/404.jpg')).rejects.toThrow('HTTP error! status: 404');
        });
    });
});
