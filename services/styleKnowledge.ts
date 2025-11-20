
export const styleKnowledgeMap: Record<string, string> = {
    // Portrait Styles
    'Light and Airy': 'This style is characterized by high exposure settings, soft shadows, and lifted black levels. It often features pastel color tones and brightened skin, creating a dreamy, ethereal, and romantic quality.',
    'Dark and Moody': 'A dramatic style that utilizes rich, deep shadows and muted highlights. The color palette often consists of earthy tones, and deep blacks are used to create an emotional and atmospheric look.',
    'Natural and True-to-Life': 'Focuses on authenticity with minimal edits. This style aims for faithful color reproduction and balanced contrast, giving images a documentary or candid feel.',
    'High Contrast Editorial': 'Commonly seen in magazines, this style features deep blacks, bright highlights, and crisp, sharp details. It provides a polished, professional, and impactful look.',
    'Film-Inspired Vintage': 'Mimics the aesthetic of classic analog film. Key characteristics include muted colors, a visible grain texture, and faded black levels, evoking a sense of nostalgia.',
    'Cinematic/Teal and Orange': 'A popular color grading technique in films. It creates a complementary color contrast by shifting shadows towards teal/cyan and skin tones towards orange, resulting in a visually appealing, movie-like image.',
    
    // Landscape Styles
    'Bright and Vibrant': 'This style enhances natural scenes with saturated colors, rich greens and blues, and eye-popping contrast to make the landscape feel alive and energetic.',
    'HDR Landscapes': 'Uses High Dynamic Range techniques to capture a wider range of light and shadow detail than standard photos. The result is often dramatic, with striking clarity and texture.',
    'Minimalist Landscapes': 'Focuses on simple compositions, clean lines, and the use of negative space to create a calm, serene, and often abstract representation of the landscape.',

    // Other Styles
    'Cyberpunk Cityscape': 'A futuristic style defined by neon-drenched cityscapes at night, towering skyscrapers, and a dystopian atmosphere, often inspired by films like Blade Runner.',
    'Watercolor Landscape': 'Emulates the look of a watercolor painting, with soft, blended edges, visible paper texture, and vibrant, flowing colors.',
    'High-Contrast B&W': 'A powerful black and white style that uses deep, pure blacks and bright, clean whites. It removes color to emphasize form, texture, and the interplay of light and shadow.',
    'Fantasy Art': 'An epic and imaginative style reminiscent of classic oil paintings. It features detailed characters, mythical creatures, and fantastical landscapes with dramatic, cinematic lighting.',
};

export const getStyleDescription = (styleName: string): string => {
    return styleKnowledgeMap[styleName] || 'No detailed description available for this style. It is a recognized aesthetic category, but a specific summary has not been provided in the knowledge base.';
}
