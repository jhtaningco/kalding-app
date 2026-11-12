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
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCursorRef = useRef<HTMLSpanElement>(null);

  // Auto focus input on mount and when clicking the area
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, targetText]);

  const currentIndex = typedText.length;

  // Auto-scroll active cursor smoothly into view as the user types across lines and paragraphs
  useEffect(() => {
    if (activeCursorRef.current) {
      activeCursorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    let value = e.target.value;

    // Check if the latest typed character was a mistake
    if (value.length > typedText.length) {
      const lastIndex = value.length - 1;
      const expectedChar = targetText[lastIndex];
      const actualChar = value[lastIndex];

      // If expected character was a newline and user typed a space, auto-convert it
      if (expectedChar === "\n" && actualChar === " ") {
        value = value.slice(0, lastIndex) + "\n";
      } else if (expectedChar && actualChar && expectedChar !== actualChar) {
        onMistake?.();
      }
    }

    onChange(value);

    // Auto submit if the user typed the entire sentence/definition/paragraph
    if (value.length >= targetText.length && onSubmit) {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    // 1. Submit if at the end of the entire text
    if (e.key === "Enter" && currentIndex >= targetText.length && onSubmit) {
      e.preventDefault();
      onSubmit(typedText);
      return;
    }

    // 2. Transition across paragraph break (\n) with Enter or Space
    if (targetText[currentIndex] === "\n") {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const nextVal = typedText + "\n";
        onChange(nextVal);
        if (nextVal.length >= targetText.length && onSubmit) {
          onSubmit(nextVal);
        }
        return;
      }
    }

    // 3. In single-sentence mode (no newlines in targetText), Enter submits early
    if (e.key === "Enter" && !targetText.includes("\n") && onSubmit) {
      e.preventDefault();
      onSubmit(typedText);
      return;
    }
  };

  // Precompute paragraph boundaries for multi-paragraph layouts
  const paragraphs = targetText.split("\n");
  const paragraphInfos: {
    text: string;
    startIndex: number;
    endIndex: number;
    hasNewlineAfter: boolean;
  }[] = [];

  let runningIndex = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const pText = paragraphs[i];
    const startIndex = runningIndex;
    const endIndex = startIndex + pText.length;
    const hasNewlineAfter = i < paragraphs.length - 1;
    paragraphInfos.push({
      text: pText,
      startIndex,
      endIndex,
      hasNewlineAfter,
    });
    runningIndex = endIndex + (hasNewlineAfter ? 1 : 0);
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`border-border bg-card relative flex w-full flex-col gap-4 rounded-3xl border-2 p-6 shadow-sm transition-all sm:p-8 max-h-[70vh] overflow-y-auto ${
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
        maxLength={targetText.length + 10}
        autoCapitalize="sentences"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        rows={1}
        inputMode="text"
        className="absolute inset-0 size-full cursor-text opacity-0"
        aria-label="Sentence typing input"
      />

      {/* Rendered Text with Distinct Paragraph Spacing and Letter-by-Letter Styling */}
      <div className="flex flex-col gap-6 sm:gap-8 select-none">
        {paragraphInfos.map((pInfo, pIdx) => {
          return (
            <div
              key={pIdx}
              className="font-mono text-lg leading-relaxed sm:text-xl md:text-2xl tracking-normal break-words"
            >
              {pInfo.text.split("").map((char, charIdx) => {
                const globalIndex = pInfo.startIndex + charIdx;
                const isTyped = globalIndex < typedText.length;
                const typedChar = typedText[globalIndex];
                const isCurrent = globalIndex === currentIndex;
                const isCorrect = isTyped && typedChar === char;
                const isWrong = isTyped && typedChar !== char;

                let charClass = "text-muted/60"; // Pending default

                if (isCorrect) {
                  charClass = "text-success-fg font-extrabold";
                } else if (isWrong) {
                  charClass =
                    "text-danger-fg bg-danger-bg/80 rounded-sm underline font-extrabold";
                }

                const displayChar = isWrong
                  ? typedChar === " "
                    ? "\u2423"
                    : typedChar
                  : char;

                return (
                  <span
                    key={charIdx}
                    ref={isCurrent ? activeCursorRef : undefined}
                    className="relative inline-block whitespace-pre"
                  >
                    {/* Blinking typing cursor */}
                    {isCurrent && !disabled && (
                      <span className="bg-primary absolute -left-[1px] top-[10%] bottom-[10%] w-[2.5px] animate-pulse rounded-full" />
                    )}
                    <span className={charClass}>{displayChar}</span>
                  </span>
                );
              })}

              {/* Enter/Return indicator at the end of paragraph if another paragraph follows */}
              {pInfo.hasNewlineAfter && (
                <span
                  ref={currentIndex === pInfo.endIndex ? activeCursorRef : undefined}
                  className="relative inline-block ml-1.5 align-baseline"
                >
                  {/* Blinking cursor at paragraph boundary */}
                  {currentIndex === pInfo.endIndex && !disabled && (
                    <span className="bg-primary absolute -left-[1px] top-[10%] bottom-[10%] w-[2.5px] animate-pulse rounded-full" />
                  )}
                  <span
                    className={`inline-flex items-center text-xs font-sans font-black px-1.5 py-0.5 rounded-md border transition-all ${
                      currentIndex > pInfo.endIndex
                        ? "border-success-fg/30 bg-success-bg/20 text-success-fg opacity-70"
                        : currentIndex === pInfo.endIndex
                          ? "border-primary bg-primary/20 text-primary shadow-sm animate-pulse"
                          : "border-border/60 bg-background/60 text-muted/50"
                    }`}
                    title="Press Enter or Space to continue to next paragraph"
                  >
                    ↵
                  </span>
                </span>
              )}
            </div>
          );
        })}

        {/* Cursor at the end of the text */}
        {currentIndex >= targetText.length && !disabled && (
          <span className="bg-primary inline-block h-5 w-[2.5px] animate-pulse align-middle rounded-full -mt-2" />
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
              : targetText[currentIndex] === "\n"
                ? "Press Enter or Space for next paragraph ↵"
                : `${Math.round((typedText.length / Math.max(1, targetText.length)) * 100)}% complete`}
        </span>
      </div>
    </div>
  );
}
