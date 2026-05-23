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
          className="rounded-full border border-[#E8DDD0] bg-[#FAF6F0] px-3 py-1.5 text-xs font-medium text-[#6B5E52] transition hover:bg-[#F4E8DC]/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
