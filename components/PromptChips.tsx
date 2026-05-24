"use client";

interface PromptChipsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function PromptChips({ prompts, onSelect, disabled }: PromptChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="min-h-[36px] rounded-full border border-[var(--card-border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--salmon)] hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
