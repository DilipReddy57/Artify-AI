import React from 'react';
import { Server, Cog, Workflow, AlertTriangle, Wand, Paintbrush2, CheckCircle, Database } from 'lucide-react';

const architectureLayers = [
    {
        icon: Server,
        title: "Layer 1: API Layer",
        purpose: "The public-facing gateway that handles all incoming requests, authentication, and basic validation.",
        responsibilities: [
            "Request Handling & Routing",
            "Input Schema Validation",
            "Authentication & Rate Limiting",
            "Error Handling & Formatting"
        ]
    },
    {
        icon: Cog,
        title: "Layer 2: Service Layer",
        purpose: "Orchestrates the business logic, coordinating different parts of the system to fulfill a request.",
        responsibilities: [
            "Business Logic Flow Control",
            "Orchestrates Analysis & Transfer",
            "Manages Caching & Job Queues",
            "Interfaces with File Storage"
        ]
    },
    {
        icon: Workflow,
        title: "Layer 3: Core Pipeline",
        purpose: "The main workflow engine that executes the style transfer process in a clean, sequential, and robust manner.",
        responsibilities: [
            "Manages the 6-Stage Pipeline",
            "Passes Context Between Stages",
            "Ensures Logical Flow & Execution",
            "Handles Pipeline-Level Errors"
        ]
    },
    {
        icon: AlertTriangle,
        title: "Layer 4: Conflict Detection",
        purpose: "Intelligently identifies potential issues between the source and target images before processing begins.",
        responsibilities: [
            "Detects Mismatches (e.g., Poster-to-Photo)",
            "Analyzes Compositional Differences",
            "Checks for Resolution & Quality Gaps",
            "Determines the Safest Transfer Strategy"
        ]
    },
    {
        icon: Wand,
        title: "Layer 5: Style Extraction",
        purpose: "The AI-powered core that deconstructs the source image to understand and quantify its unique aesthetic.",
        responsibilities: [
            "Uses Neural Models (VGG) for Texture",
            "Uses Vision Models for Semantics",
            "Fuses Multiple AI Models (Multi-Modal)",
            "Adapts Strategy Based on Conflicts"
        ]
    },
    {
        icon: Paintbrush2,
        title: "Layer 6: Style Application",
        purpose: "Applies the extracted style characteristics to the target image in a sophisticated, content-aware manner.",
        responsibilities: [
            "Performs Color Grading & Lighting Transfer",
            "Applies Textures & Special Effects",
            "Uses Neural Optimization for Accuracy",
            "Refines Edits with Semantic Guidance"
        ]
    },
    {
        icon: CheckCircle,
        title: "Layer 7: Validation & Models",
        purpose: "The foundation layer that provides the AI models and validates the final output for quality and consistency.",
        responsibilities: [
            "Hosts Pre-trained AI/ML Models",
            "Provides Vision Analysis (Detection)",
            "Validates Output Quality",
            "Ensures Adherence to Original Prompt"
        ]
    }
];

interface LayerCardProps {
    layer: typeof architectureLayers[0];
    isLast: boolean;
}

const LayerCard: React.FC<LayerCardProps> = ({ layer, isLast }) => {
    const Icon = layer.icon;
    return (
        <div className="flex gap-6 relative">
            {/* Timeline Graphic */}
            <div className="flex flex-col items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 border-2 border-primary/50 text-primary rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                </div>
                {!isLast && <div className="w-0.5 flex-grow bg-border mt-2"></div>}
            </div>

            {/* Content */}
            <div className="flex-grow pb-12">
                <h3 className="text-xl font-bold text-foreground mb-1">{layer.title}</h3>
                <p className="text-md text-muted-foreground mb-4">{layer.purpose}</p>
                <div className="bg-card border border-border p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-foreground mb-2">Key Responsibilities:</h4>
                    <ul className="space-y-2">
                        {layer.responsibilities.map((resp, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-foreground/80">
                                <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                                <span>{resp}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export const ArchitectureView: React.FC = () => {
    return (
        <main className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-foreground">Backend Architecture</h2>
                        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                            A conceptual overview of the robust, multi-layered system powering Artify AI's style transfer and analysis engine.
                        </p>
                    </div>

                    <div className="space-y-0">
                        {architectureLayers.map((layer, index) => (
                            <LayerCard 
                                key={layer.title} 
                                layer={layer} 
                                isLast={index === architectureLayers.length - 1} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};
