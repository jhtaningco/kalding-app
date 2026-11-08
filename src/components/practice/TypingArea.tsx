"use client";

import { useEffect, useRef } from "react";
import { evaluateLiveTyping } from "@/core/checkAnswer";

export type TypingAreaProps = {
  targetWord: string;
  typedText: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  onMistake?: () => void;
};

export function TypingArea({
  targetWord,
  typedText,
  onChange,
  onSubmit,
  disabled = false,
  onMistake,
}: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const prevTypedRef = useRef<string>(typedText);

  // Auto-focus the input on mount or when targetWord changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [targetWord]);

  // Keep input focused when clicking anywhere in the typing container
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const evalResult = evaluateLiveTyping(targetWord, typedText);

  // Detect new mistakes as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    const prevVal = prevTypedRef.current;
    prevTypedRef.current = nextVal;

    // Check if user just typed a wrong character
    if (nextVal.length > prevVal.length) {
      const charIndex = nextVal.length - 1;
      const expectedChar = targetWord[charIndex]?.toLowerCase();
      const actualChar = nextVal[charIndex]?.toLowerCase();

      if (expectedChar && actualChar !== expectedChar) {
        onMistake?.();
      }
    }

    onChange(nextVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className="border-border bg-card hover:border-primary/60 focus-within:border-primary focus-within:ring-focus/30 relative flex min-h-[96px] w-full cursor-text items-center justify-center rounded-3xl border-2 p-6 shadow-[0_4px_0_var(--secondary-shadow)] transition-all focus-within:ring-4"
    >
      {/* Hidden input to capture keystrokes on desktop & mobile keyboards */}
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        value={typedText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        className="absolute inset-0 size-full cursor-default opacity-0"
        aria-label="Type the word here"
      />

      {/* Rendered Live Typing Display */}
      <div
        aria-hidden="true"
        className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-3xl font-extrabold tracking-wider sm:text-4xl"
      >
        {evalResult.letters.map((item, idx) => {
          const isCursor = idx === evalResult.cursorIndex && !disabled;

          return (
            <span key={idx} className="relative inline-flex items-center justify-center">
              {isCursor && (
                <span className="animate-blink bg-primary absolute -left-1 h-8 w-1 rounded-full" />
              )}
              <span
                className={`inline-block min-w-[24px] text-center transition-colors ${
                  item.status === "correct"
                    ? "text-letter-correct"
                    : item.status === "wrong"
                      ? "bg-danger-bg text-letter-wrong rounded-md px-0.5"
                      : "text-letter-pending/40"
                }`}
              >
                {/* When pending, show target letter faintly or underscore */}
                {item.status === "pending" ? item.expectedChar : item.char}
              </span>
            </span>
          );
        })}

        {/* Cursor if at end of word */}
        {evalResult.cursorIndex >= targetWord.length &&
          evalResult.extraLetters.length === 0 &&
          !disabled && (
            <span className="animate-blink bg-primary inline-block h-8 w-1 rounded-full" />
          )}

        {/* Overflow extra characters typed beyond word length */}
        {evalResult.extraLetters.map((char, idx) => (
          <span
            key={`extra-${idx}`}
            className="bg-danger-bg text-letter-wrong rounded-md px-0.5"
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
