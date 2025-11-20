
import React, { useRef } from 'react';
import type { Inspiration } from '../types';
import { Hero } from '../components/ui/animated-hero';
import type { View } from '../App';
import { StaggerTestimonials } from '../components/ui/stagger-testimonials';
import { CreatorCTA } from '../components/ui/creator-cta';
import { FeatureShowcase } from '../components/FeatureShowcase';
import { Layers, Palette, Link as LinkIcon } from 'lucide-react';
import { Accordion, AccordionItem } from '../components/ui/accordion';
import { StaticBeforeAfter } from '../components/StaticBeforeAfter';
import { ChatWidget } from '../components/ChatWidget';

// --- Showcase Image Assets (Unsplash sourced for reliability and quality) ---
const STYLE_TRANSFER_BEFORE_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop'; // Portrait
const STYLE_TRANSFER_AFTER_URL = 'https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?q=80&w=1200&auto=format&fit=crop'; // Neon/Cyberpunk style
const MAGIC_EDIT_BEFORE_URL = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1200&auto=format&fit=crop'; // Nature
const MAGIC_EDIT_AFTER_URL = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop'; // Fantasy/Edited Nature
const AI_GENERATION_URL = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop'; // Abstract Oil Painting

const inspirationGalleryItems: Inspiration[] = [
  {
    id: 'style-1',
    title: 'Dark & Moody Portrait',
    description: 'A dramatic, cinematic portrait with deep shadows and muted colors, perfect for creating an emotional and atmospheric look.',
    imageUrl: 'https://images.unsplash.com/photo-1534008915239-82b6958d2396?q=80&w=600&auto=format&fit=crop',
    prompt: 'A dramatic, cinematic portrait of a woman, dark and moody style, deep shadows, muted colors, emotional atmosphere'
  },
  {
    id: 'style-2',
    title: 'Light & Airy',
    description: 'Soft and bright, this style uses high exposure and pastel tones for a dreamy, ethereal quality.',
    imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&auto=format&fit=crop',
    prompt: 'A light and airy portrait of a woman in a field of flowers, high exposure, soft shadows, pastel tones, brightened skin'
  },
  {
    id: 'generate-1',
    title: 'Cyberpunk Cityscape',
    description: 'A neon-drenched, futuristic city at night, filled with towering skyscrapers and flying vehicles.',
    imageUrl: 'https://images.unsplash.com/photo-1542903660-eedba2cda473?q=80&w=600&auto=format&fit=crop',
    prompt: 'A sprawling cyberpunk cityscape at night, neon lights, dystopian future, high-tech low-life, Blade Runner aesthetic'
  },
  {
    id: 'style-3',
    title: 'Vintage Film Look',
    description: 'A nostalgic style that mimics classic film photography with grain, muted colors, and a timeless feel.',
    imageUrl: 'https://images.unsplash.com/photo-1517260739337-6799d239ce83?q=80&w=600&auto=format&fit=crop',
    prompt: 'A vintage photograph of a classic car on a deserted road, 1970s, muted colors, film grain, analog feel'
  },
  {
    id: 'generate-2',
    title: 'Watercolor Landscape',
    description: 'A serene landscape painted in the soft, flowing style of watercolor, with vibrant colors and delicate textures.',
    imageUrl: 'https://images.unsplash.com/photo-1558470598-a5dda9640f6b?q=80&w=600&auto=format&fit=crop',
    prompt: 'A serene mountain landscape, watercolor painting, soft edges, paper texture, vibrant colors'
  },
  {
    id: 'style-4',
    title: 'High-Contrast B&W',
    description: 'A powerful black and white style with deep blacks and bright whites, emphasizing form and texture.',
    imageUrl: 'https://images.unsplash.com/photo-1605218457336-921525589119?q=80&w=600&auto=format&fit=crop',
    prompt: 'High contrast black and white architectural photography, deep blacks, bright whites, dramatic shadows, emphasizing form and texture'
  },
  {
    id: 'generate-3',
    title: 'Fantasy Art',
    description: 'An epic fantasy scene reminiscent of classic oil paintings, with detailed characters and mythical landscapes.',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=600&auto=format&fit=crop',
    prompt: 'An epic fantasy battle scene, detailed, oil painting style, Dungeons and Dragons, cinematic lighting'
  },
  {
    id: 'style-5',
    title: 'Minimalist Composition',
    description: 'Clean and simple, this style focuses on negative space and strong lines to create a calming, modern aesthetic.',
    imageUrl: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=600&auto=format&fit=crop',
    prompt: 'Minimalist landscape, simple composition, negative space, clean lines, single tree on a hill'
  }
];


interface InspirationViewProps {
    onSelectInspiration: (inspiration: Inspiration, action: 'style' | 'generate') => void;
    setActiveView: (view: View) => void;
}

// --- NEW SHOWCASE VISUALS ---

const AnalysisVisual = () => {
  const ANALYSIS_IMAGE_URL = 'https://images.unsplash.com/photo-1663327559195-76e9a6845a7f?q=80&w=600&auto=format&fit=crop';
  const mockPalette = ['#0A0A0A', '#F5F5F5', '#8C8C8C', '#4A4A4A', '#D9D9D9'];
  const mockEffects = ['High Contrast', 'Sharpening', 'Deep Blacks', 'Texture Emphasis'];

  return (
    <div className="flex h-full w-full items-center justify-center p-4 gap-4 bg-black">
      <div className="w-1/2 h-full">
        <img src={ANALYSIS_IMAGE_URL} alt="Building for analysis" className="object-cover h-full w-full rounded-md" />
      </div>
      <div className="w-1/2 h-full bg-card p-3 rounded-md flex flex-col text-left text-sm">
        <h4 className="font-bold text-foreground mb-2">Analysis Result</h4>
        <div className="space-y-3 overflow-y-auto text-xs">
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Identified Style</p>
            <p className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md mt-1">High-Contrast B&W</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Dominant Colors</p>
            <div className="flex gap-1.5 mt-1">
              {mockPalette.map(color => <div key={color} className="w-5 h-5 rounded-sm border border-border" style={{ backgroundColor: color }} />)}
            </div>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Effects Pipeline</p>
            <ul className="list-disc pl-4 mt-1 space-y-1 text-foreground/80">
              {mockEffects.map(effect => <li key={effect}>{effect}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResearchVisual = () => {
    return (
        <div className="h-full w-full bg-black p-4 flex flex-col justify-center">
            <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-md mx-auto w-full">
                <p className="text-sm font-semibold text-muted-foreground">Q: What are the latest trends in portrait photography for 2024?</p>
                <div className="my-3 h-px bg-border" />
                <div className="text-sm text-foreground space-y-2">
                    <p><strong className="text-primary">A: </strong> The biggest trend for 2024 is **authenticity**. Photographers are moving away from overly polished looks towards more natural, "no-edit" styles. There's also a rise in vintage aesthetics, with heavy use of **film grain** and warmer, nostalgic tones...</p>
                </div>
                <div className="mt-4">
                    <h4 className="font-bold text-xs flex items-center gap-1.5 text-muted-foreground"><LinkIcon className="h-3 w-3" /> Sources</h4>
                    <ul className="text-xs space-y-1 mt-1">
                        <li><a href="#" className="text-primary/80 hover:underline">petapixel.com/2024-photo-trends</a></li>
                        <li><a href="#" className="text-primary/80 hover:underline">vogue.com/photography-styles</a></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export const InspirationView: React.FC<InspirationViewProps> = ({ onSelectInspiration, setActiveView }) => {
    const featureSectionRef = useRef<HTMLDivElement>(null);
    const handleLearnMore = () => {
        featureSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <div>
            <Hero onGetStarted={() => setActiveView('style')} onLearnMore={handleLearnMore}/>
            
            <div ref={featureSectionRef}>
              <FeatureShowcase 
                title="Intelligent Style Transfer"
                description="Go beyond filters. Artify's AI deeply analyzes the color grading, lighting, texture, and composition of a source image, then intelligently applies that aesthetic to your own photos. It's not a filter—it's a complete stylistic recreation."
              >
                 <StaticBeforeAfter beforeSrc={STYLE_TRANSFER_BEFORE_URL} afterSrc={STYLE_TRANSFER_AFTER_URL} />
              </FeatureShowcase>
            </div>

            <FeatureShowcase 
              title="Magic Edit with Gemini"
              description="Describe your desired change in plain English. Want to remove a distracting object? Add a dramatic sunset? Change the color of a dress? Gemini understands your intent and makes complex edits in seconds. It's conversational, intuitive, and incredibly powerful."
              align="right"
            >
              <StaticBeforeAfter beforeSrc={MAGIC_EDIT_BEFORE_URL} afterSrc={MAGIC_EDIT_AFTER_URL} />
            </FeatureShowcase>
            
            <FeatureShowcase 
              title="AI Image Generation"
              description="From photorealistic portraits to abstract concepts, bring any idea to life. Powered by Imagen 2, our generation tool gives you fine-grained control over your creations, turning your text prompts into stunning, high-quality visuals."
            >
               <img src={AI_GENERATION_URL} alt="AI generated art" className="object-cover w-full h-full" />
            </FeatureShowcase>

            <FeatureShowcase 
              title="Deconstruct Any Style"
              description="Ever wonder how a photo gets its unique look? Upload any image and our AI will deconstruct it, revealing the exact color palette, typography, and sequence of effects used. It's the ultimate tool for learning and inspiration."
              align="right"
            >
              <AnalysisVisual />
            </FeatureShowcase>
            
            <FeatureShowcase 
              title="AI-Powered Research"
              description="Stay ahead of the creative curve. Ask our AI assistant about the latest photography trends, historical art movements, or technical questions. It provides up-to-date, accurate answers grounded in Google Search, complete with sources."
            >
               <ResearchVisual />
            </FeatureShowcase>

            <section className="py-16 md:py-24 px-4 md:px-8 bg-background">
                <div className="container mx-auto max-w-6xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Get Inspired</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Explore a curated collection of styles. Find a look you love, and with one click, you can either transfer its style to your own image or use its prompt as a starting point for a new AI generation.</p>
                </div>
                <InspirationGallery onSelectInspiration={onSelectInspiration} />
            </section>
            
            <section className="py-16 md:py-24 px-4 md:px-8 bg-card/50">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Built for Creators, by Creators</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Hear what creative professionals are saying about Artify AI.</p>
                </div>
                <StaggerTestimonials />
            </section>
            
            <section className="py-16 md:py-24 px-4 md:px-8 bg-background">
                <div className="container mx-auto max-w-4xl">
                   <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-center mb-12">Frequently Asked Questions</h2>
                   <FAQ />
                </div>
            </section>

            <section className="py-16 md:py-24 px-4 md:px-8 bg-card/50">
                <CreatorCTA />
            </section>
            <ChatWidget />
        </div>
    );
};

// --- INSPIRATION GALLERY ---

const InspirationGallery: React.FC<{ onSelectInspiration: (inspiration: Inspiration, action: 'style' | 'generate') => void }> = ({ onSelectInspiration }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-7xl mx-auto">
            {inspirationGalleryItems.map(item => (
                <div key={item.id} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="p-4">
                        <h3 className="font-bold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 h-20 overflow-hidden">{item.description}</p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end items-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="text-center text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                           {item.id.startsWith('style') ? (
                                <button
                                    onClick={() => onSelectInspiration(item, 'style')}
                                    className="bg-primary text-primary-foreground text-sm font-semibold py-2 px-4 rounded-full flex items-center gap-2"
                                >
                                    <Layers className="w-4 h-4" /> Try This Style
                                </button>
                            ) : (
                                <button
                                    onClick={() => onSelectInspiration(item, 'generate')}
                                    className="bg-primary text-primary-foreground text-sm font-semibold py-2 px-4 rounded-full flex items-center gap-2"
                                >
                                    <Palette className="w-4 h-4" /> Use This Prompt
                                </button>
                            )}
                            <p className="text-xs mt-3 opacity-80 px-2 line-clamp-2">Prompt: "{item.prompt}"</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- FAQ ---
const FAQ: React.FC = () => (
  <Accordion>
    <AccordionItem title="What's the difference between Style Transfer and just using a filter?">
        Filters are simple overlays that apply uniform changes across an image. Our AI-powered Style Transfer is far more advanced. It deeply analyzes the source image's unique characteristics—like lighting, color harmony, texture, and even composition—and then intelligently re-interprets and applies that entire aesthetic DNA to your photo, adapting it to your subject matter.
    </AccordionItem>
    <AccordionItem title="How is my data and privacy handled when I upload an image?">
        Your privacy is our top priority. The images you upload are sent securely to Google's AI models for processing and are not stored long-term or used for any other purpose. All analysis and editing happen in a transient, secure environment.
    </AccordionItem>
    <AccordionItem title="Can I use images created with Artify AI for commercial projects?">
        Yes! The images you create using your own uploaded photos are your property. For images generated purely from an AI prompt, they are generally available for you to use as you see fit, in line with Google's Generative AI terms. We always recommend reviewing the latest terms of service for specific use cases.
    </AccordionItem>
    <AccordionItem title="What are the limitations of Magic Edit? What kinds of prompts work best?">
        Magic Edit is incredibly powerful but works best with clear, direct commands. For example, 'remove the person in the background' or 'change the red car to blue' works better than vague requests like 'make it look cooler'. It excels at object removal, color changes, and adding plausible elements. Very complex additions that require specific artistic interpretation may need a few attempts or more detailed prompts.
    </AccordionItem>
    <AccordionItem title="Why does the AI sometimes get details like hands or text wrong in image generation?">
        This is a known challenge in the field of generative AI. Models like Imagen 2 are trained on vast datasets of images, but accurately rendering complex, consistent details like the five fingers of a hand or precise lettering requires an immense amount of specific anatomical and linguistic understanding. While the models are constantly improving at an incredible rate, these intricate details are on the frontier of what's possible.
    </AccordionItem>
     <AccordionItem title="How does the AI know the difference between styles like 'Dark and Moody' and 'Cinematic'?">
      Our AI has been trained with an extensive "knowledge base" (you can think of it like a textbook for AI) that defines these styles based on key attributes. For example, it knows 'Dark and Moody' relies on deep shadows and muted colors, while 'Cinematic' often involves specific color grading like the 'teal and orange' look. When you upload an image, the AI compares its visual data against this knowledge base to find the closest match.
    </AccordionItem>
  </Accordion>
);
