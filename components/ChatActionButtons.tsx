"use client";

import type { ChatAction } from "@/lib/types";

interface ChatActionButtonsProps {
  actions: ChatAction[];
  appliedIndices?: number[];
  onAction: (action: ChatAction, index: number) => void;
  disabled?: boolean;
}

export function ChatActionButtons({
  actions,
  appliedIndices = [],
  onAction,
  disabled,
}: ChatActionButtonsProps) {
  if (!actions.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action, index) => {
        const used = appliedIndices.includes(index);
        return (
          <button
            key={`${action.type}-${index}-${action.label}`}
            type="button"
            disabled={disabled || used}
            onClick={() => onAction(action, index)}
            className="rounded-full border border-[var(--salmon)]/40 bg-[var(--salmon)]/10 px-3 py-1.5 text-xs font-medium text-[var(--salmon-dark)] transition hover:bg-[var(--salmon)]/20 disabled:cursor-default disabled:opacity-50"
          >
            {used ? `✓ ${action.label}` : action.label}
          </button>
        );
      })}
    </div>
  );
}
