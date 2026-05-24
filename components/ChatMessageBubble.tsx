"use client";

import { ChatActionButtons } from "./ChatActionButtons";
import { ChatRecipeCards } from "./ChatRecipeCards";
import { SuggestedShoppingItems } from "./SuggestedShoppingItems";
import { parseAIResponse } from "@/lib/ai/chatHelpers";
import type { ChatAction, ChatMessage } from "@/lib/types";

/** Show plain text even if an old message stored raw JSON. */
function displayChatContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") || !trimmed.includes('"message"')) {
    return content;
  }
  const parsed = parseAIResponse(trimmed);
  return parsed.text || content;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onAddSuggestedItems?: (messageId: string) => void;
  onApplyInventoryUpdates?: (messageId: string) => void;
  onAction?: (messageId: string, action: ChatAction, index: number) => void;
  actionsDisabled?: boolean;
}

export function ChatMessageBubble({
  message,
  onAddSuggestedItems,
  onApplyInventoryUpdates,
  onAction,
  actionsDisabled,
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
        <p className="whitespace-pre-wrap">{displayChatContent(message.content)}</p>

        {message.warnings && message.warnings.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-amber-800">
            {message.warnings.map((warning) => (
              <li key={warning}>⚠ {warning}</li>
            ))}
          </ul>
        )}

        {message.recipes && message.recipes.length > 0 && (
          <ChatRecipeCards recipes={message.recipes} />
        )}

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

        {!isUser && message.actions && message.actions.length > 0 && onAction && (
          <ChatActionButtons
            actions={message.actions}
            appliedIndices={message.actionsApplied}
            onAction={(action, index) => onAction(message.id, action, index)}
            disabled={actionsDisabled}
          />
        )}

        {!isUser &&
          message.inventoryUpdates &&
          message.inventoryUpdates.length > 0 &&
          onApplyInventoryUpdates && (
            <div className="mt-3 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Pantry deductions
              </p>
              <ul className="mb-3 space-y-1 text-xs text-[var(--text-muted)]">
                {message.inventoryUpdates.map((u) => (
                  <li key={`${u.name}-${u.amountUsed}`}>
                    · {u.name}: −{u.amountUsed} {u.unit}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={message.inventoryUpdatesApplied}
                onClick={() => onApplyInventoryUpdates(message.id)}
                className="w-full rounded-lg bg-[var(--salmon)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {message.inventoryUpdatesApplied
                  ? "Pantry updated"
                  : "Deduct from pantry"}
              </button>
            </div>
          )}

        {!isUser &&
          message.suggestedItems &&
          message.suggestedItems.length > 0 &&
          onAddSuggestedItems &&
          !message.actions?.length && (
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
