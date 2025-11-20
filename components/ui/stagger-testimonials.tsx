"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const SQRT_5000 = Math.sqrt(5000);

const testimonials = [
  {
    tempId: 1,
    testimonial: "Artify's AI generation is my secret weapon for overcoming creative blocks. I can quickly iterate on dozens of concepts and styles, which has accelerated my workflow by at least 5x.",
    by: "Arjun Singh, Concept Artist",
  },
  {
    tempId: 2,
    testimonial: "The Style Transfer feature is a game-changer. I can now apply my signature look across an entire wedding album in minutes, not hours. My clients are thrilled with the consistency.",
    by: "Riya Mehta, Wedding Photographer",
  },
  {
    tempId: 3,
    testimonial: "Magic Edit is pure genius. Removing photobombers or changing a product color with a simple text prompt saves me so much time. It's an indispensable tool for creating perfect social content.",
    by: "Sneha Verma, Social Media Manager",
  },
  {
    tempId: 4,
    testimonial: "The 'Analyze' feature is an incredible learning tool. I upload work from my favorite artists, and Artify deconstructs their style into a step-by-step pipeline. It's like having a masterclass on demand.",
    by: "Vikram Kumar, Indie Game Developer",
  },
  {
    tempId: 5,
    testimonial: "The AI Research Assistant is invaluable. I can instantly get up-to-date information on design trends or historical aesthetics, complete with sources. It's my go-to for mood boarding and pre-production.",
    by: "Priya Patel, Art Director",
  },
];

interface TestimonialCardProps {
  position: number;
  testimonial: typeof testimonials[0];
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  position, 
  testimonial, 
  handleMove, 
  cardSize 
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out flex flex-col justify-center",
        isCenter 
          ? "z-10 bg-primary text-primary-foreground border-primary" 
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px hsl(var(--border))" : "0px 0px 0px 0px transparent"
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2
        }}
      />
      <h3 className={cn(
        "text-base sm:text-xl font-medium",
        isCenter ? "text-primary-foreground" : "text-foreground"
      )}>
        "{testimonial.testimonial}"
      </h3>
      <p className={cn(
        "absolute bottom-8 left-8 right-8 mt-2 text-sm italic",
        isCenter ? "text-primary-foreground/80" : "text-muted-foreground"
      )}>
        - {testimonial.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365);
  const [testimonialsList, setTestimonialsList] = useState(testimonials);
  const [isHovered, setIsHovered] = useState(false);

  const handleMove = useCallback((steps: number) => {
    if (steps === 0) return;
    setTestimonialsList(currentList => {
      const newList = [...currentList];
      if (steps > 0) {
        for (let i = 0; i < steps; i++) {
          const item = newList.shift();
          if (!item) return newList;
          newList.push({ ...item, tempId: Math.random() });
        }
      } else {
        for (let i = 0; i < Math.abs(steps); i++) {
          const item = newList.pop();
          if (!item) return newList;
          newList.unshift({ ...item, tempId: Math.random() });
        }
      }
      return newList;
    });
  }, []);

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (isHovered) return;

    const intervalId = setInterval(() => {
      handleMove(1);
    }, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(intervalId);
  }, [isHovered, handleMove]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 600 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {testimonialsList.map((testimonial, index) => {
        const position = index - 2; // Center the 3rd item (index 2)
        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Previous testimonial"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Next testimonial"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};
