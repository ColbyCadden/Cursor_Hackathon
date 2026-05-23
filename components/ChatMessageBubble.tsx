"use client";

import type { ChatMessage } from "@/lib/types";
import { SuggestedShoppingItems } from "./SuggestedShoppingItems";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onAddSuggested?: (messageId: string) => void;
}

export function ChatMessageBubble({
  message,
  onAddSuggested,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  const bubbleClass = isUser
    ? "rounded-br-md bg-[#F4A896]/35 text-[#3D3429]"
    : "rounded-bl-md border border-[#E8DDD0] bg-[#FAF6F0] text-[#3D3429]";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] ${bubbleClass}`}
      >
        {!isUser && (
          <p className="mb-1 text-xs font-semibold text-[#8B6F5C]">PrepDeck AI</p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.mealPrepSteps && message.mealPrepSteps.length > 0 && (
          <div className="mt-3 rounded-lg bg-white/70 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B6F5C]">
              Simple prep order
            </p>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-[#6B5E52]">
              {message.mealPrepSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {message.suggestedItems &&
          message.suggestedItems.length > 0 &&
          onAddSuggested && (
            <SuggestedShoppingItems
              items={message.suggestedItems}
              added={message.suggestedItemsAdded}
              onAdd={() => onAddSuggested(message.id)}
            />
          )}
      </div>
    </div>
  );
}
