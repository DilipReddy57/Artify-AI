"use client";

import { CornerRightUp } from "lucide-react";
import { Textarea } from "./textarea";
import { cn } from "../../lib/utils";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";
import { TextShimmer } from "./text-shimmer";

interface AIInputWithLoadingProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit: (value: string) => void;
  className?: string;
  isLoading: boolean;
  value: string;
  onValueChange: (value: string) => void;
}

export function AIInputWithLoading({
  id = "ai-input",
  placeholder = "Ask me anything!",
  minHeight = 56,
  maxHeight = 200,
  onSubmit,
  className,
  isLoading,
  value,
  onValueChange,
}: AIInputWithLoadingProps) {
  
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onSubmit(value);
    onValueChange("");
    adjustHeight(true);
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-start flex-col gap-2">
        <div className="relative max-w-xl w-full mx-auto">
          <Textarea
            id={id}
            placeholder={placeholder}
            className={cn(
              "max-w-xl bg-black/5 dark:bg-white/5 w-full rounded-3xl pl-6 pr-10 py-4",
              "placeholder:text-black/70 dark:placeholder:text-white/70",
              "border-none ring-1 ring-black/30 dark:ring-white/30 focus-visible:ring-2 focus-visible:ring-ring",
              "text-black dark:text-white resize-none text-wrap leading-[1.2]"
            )}
            style={{ minHeight: `${minHeight}px` }}
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onValueChange(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 rounded-xl py-1 px-1",
              isLoading ? "bg-none" : "bg-black/5 dark:bg-white/5"
            )}
            type="button"
            disabled={isLoading || !value.trim()}
            aria-label="Submit"
          >
            {isLoading ? (
              <div
                className="w-4 h-4 bg-black dark:bg-white rounded-sm animate-spin transition duration-700"
                style={{ animationDuration: "3s" }}
              />
            ) : (
              <CornerRightUp
                className={cn(
                  "w-4 h-4 transition-opacity dark:text-white",
                  value ? "opacity-100" : "opacity-30"
                )}
              />
            )}
          </button>
        </div>
        <div className="pl-4 h-4 text-xs mx-auto text-black/70 dark:text-white/70 flex items-center justify-center">
            {isLoading ? (
                <TextShimmer duration={2} className="text-xs" children="AI is thinking..." />
            ) : (
                <span>Shift + Enter for new line</span>
            )}
        </div>
      </div>
    </div>
  );
}
