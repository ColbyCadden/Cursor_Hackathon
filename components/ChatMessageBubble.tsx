"use client";

import { SuggestedShoppingItems } from "./SuggestedShoppingItems";
import type { ChatMessage } from "@/lib/types";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onAddSuggestedItems?: (messageId: string) => void;
}

export function ChatMessageBubble({
  message,
  onAddSuggestedItems,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  const bubbleClass = isUser
    ? "rounded-br-md bg-[var(--salmon)]/35 text-[var(--text)]"
    : "rounded-bl-md border border-[var(--card-border)] bg-[var(--background)] text-[var(--text)]";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] ${bubbleClass}`}
      >
        {!isUser && (
          <p className="mb-1 text-xs font-semibold text-[var(--salmon-dark)]">
            PrepDeck AI
          </p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.mealPrepSteps && message.mealPrepSteps.length > 0 && (
          <div className="mt-3 rounded-lg bg-[var(--surface)] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Simple prep order
            </p>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-[var(--text-muted)]">
              {message.mealPrepSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {!isUser &&
          message.suggestedItems &&
          message.suggestedItems.length > 0 &&
          onAddSuggestedItems && (
            <SuggestedShoppingItems
              items={message.suggestedItems}
              added={message.suggestedItemsAdded}
              onAdd={() => onAddSuggestedItems(message.id)}
            />
          )}
      </div>
    </div>
  );
}
