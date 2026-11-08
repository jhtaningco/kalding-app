"use client";

import { useEffect, useRef } from "react";

export interface SentenceTypingAreaProps {
  targetText: string;
  typedText: string;
  onChange: (value: string) => void;
  onSubmit?: (value?: string) => void;
  onMistake?: () => void;
  disabled?: boolean;
}

export function SentenceTypingArea({
  targetText,
  typedText,
  onChange,
  onSubmit,
  onMistake,
  disabled = false,
}: SentenceTypingAreaProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto focus input on mount and when clicking the area
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, targetText]);

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    const value = e.target.value;

    // Check if the latest typed character was a mistake
    if (value.length > typedText.length) {
      const lastIndex = value.length - 1;
      const expectedChar = targetText[lastIndex];
      const actualChar = value[lastIndex];

      if (expectedChar && actualChar && expectedChar !== actualChar) {
        onMistake?.();
      }
    }

    onChange(value);

    // Auto submit if the user typed the entire sentence/definition
    if (value.length >= targetText.length && onSubmit) {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    if (e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit(typedText);
    }
  };

  const currentIndex = typedText.length;

  return (
    <div
      onClick={handleContainerClick}
      className={`border-border bg-card relative flex w-full flex-col gap-3 rounded-3xl border-2 p-6 shadow-sm transition-all sm:p-8 ${
        disabled ? "opacity-90 cursor-default" : "cursor-text hover:border-primary/60"
      }`}
    >
      {/* Hidden textarea capturing user input seamlessly */}
      <textarea
        ref={inputRef}
        value={typedText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={targetText.length + 5}
        autoCapitalize="sentences"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        rows={1}
        inputMode="text"
        className="absolute inset-0 size-full cursor-text opacity-0"
        aria-label="Sentence typing input"
      />

      {/* Rendered Text with Letter-by-Letter Live Styling */}
      <div className="font-mono text-lg leading-relaxed sm:text-xl md:text-2xl select-none tracking-normal">
        {targetText.split("").map((char, index) => {
          const isTyped = index < typedText.length;
          const typedChar = typedText[index];
          const isCurrent = index === currentIndex;
          const isCorrect = isTyped && typedChar === char;
          const isWrong = isTyped && typedChar !== char;

          let charClass = "text-muted/60"; // Pending default

          if (isCorrect) {
            charClass = "text-success-fg font-extrabold";
          } else if (isWrong) {
            charClass = "text-danger-fg bg-danger-bg/80 rounded-sm underline font-extrabold";
          }

          const displayChar = isWrong ? (typedChar === " " ? "â£" : typedChar) : char;

          return (
            <span key={index} className="relative inline-block whitespace-pre">
              {/* Blinking typing cursor */}
              {isCurrent && !disabled && (
                <span className="bg-primary absolute -left-[1px] top-[10%] bottom-[10%] w-[2.5px] animate-pulse rounded-full" />
              )}
              <span className={charClass}>{displayChar}</span>
            </span>
          );
        })}

        {/* Cursor at the end of the text */}
        {currentIndex >= targetText.length && !disabled && (
          <span className="bg-primary inline-block h-5 w-[2.5px] animate-pulse align-middle rounded-full" />
        )}
      </div>

      {/* Progress & helper cues */}
      <div className="border-border/60 flex items-center justify-between border-t pt-3 text-xs font-bold text-muted">
        <span>
          {Math.min(typedText.length, targetText.length)} / {targetText.length} characters
        </span>
        <span>
          {disabled
            ? "Completed"
            : currentIndex === 0
              ? "Start typing to begin..."
              : `${Math.round((typedText.length / Math.max(1, targetText.length)) * 100)}% complete`}
        </span>
      </div>
    </div>
  );
}
