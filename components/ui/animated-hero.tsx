import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoveRight, KeyRound } from "lucide-react";
import { Button } from "./button";

const words = ["beautiful", "creative", "powerful", "unique"];

function Hero({ onGetStarted, onLearnMore }: { onGetStarted: () => void, onLearnMore: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 2500); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Artify AI Launch <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-medium text-foreground h-40">
              Create something{" "}
              <AnimatePresence mode="wait">
                <motion.span
                  key={words[index]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block text-primary"
                >
                  {words[index]}
                </motion.span>
              </AnimatePresence>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              Artify AI harnesses the power of generative AI to deconstruct and replicate professional photo styles. Move beyond tedious manual editing and unlock expert-level results, faster than ever.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline" onClick={onLearnMore}>
              Learn More <KeyRound className="w-4 h-4" />
            </Button>
            <Button size="lg" className="gap-4" onClick={onGetStarted}>
              Get Started <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };