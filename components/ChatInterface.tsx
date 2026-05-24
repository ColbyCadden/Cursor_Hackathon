"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";
import { PromptChips } from "./PromptChips";
import { Toast } from "./Toast";
import { createId } from "@/lib/id";
import { generateAIResponse } from "@/lib/mockAI";
import { mergeSuggestedIntoShoppingList } from "@/lib/shoppingListHelpers";
import type { AppState, ChatMessage } from "@/lib/types";

const EXAMPLE_PROMPTS = [
  "I need to meal prep 8 meals.",
  "What can I cook with my inventory?",
  "Use fewer ingredients.",
  "Make this simpler.",
  "What's on my shopping list?",
  "Create a meal prep guide.",
];

interface ChatInterfaceProps {
  appState: AppState;
  onUpdate: (updater: (prev: AppState) => AppState) => void;
}

export function ChatInterface({ appState, onUpdate }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = appState.chatMessages;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;

      const userMessage: ChatMessage = {
        id: createId("chat"),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      onUpdate((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, userMessage],
      }));
      setInput("");
      setThinking(true);

      const stateSnapshot = {
        ...appState,
        chatMessages: [...appState.chatMessages, userMessage],
      };

      try {
        const response = await generateAIResponse(trimmed, stateSnapshot);

        const assistantMessage: ChatMessage = {
          id: createId("chat"),
          role: "assistant",
          content: response.text,
          createdAt: new Date().toISOString(),
          suggestedItems: response.suggestedItems,
          mealPrepSteps: response.mealPrepSteps,
        };

        onUpdate((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, assistantMessage],
        }));
      } finally {
        setThinking(false);
      }
    },
    [appState, onUpdate, thinking]
  );

  const handleAddSuggestedItems = (messageId: string) => {
    const message = appState.chatMessages.find((m) => m.id === messageId);
    if (!message?.suggestedItems?.length || message.suggestedItemsAdded) return;

    const { list, added, updated, skipped } = mergeSuggestedIntoShoppingList(
      appState.shoppingList,
      message.suggestedItems
    );

    onUpdate((prev) => ({
      ...prev,
      shoppingList: list,
      chatMessages: prev.chatMessages.map((m) =>
        m.id === messageId ? { ...m, suggestedItemsAdded: true } : m
      ),
    }));

    const parts: string[] = [];
    if (added) parts.push(`${added} added`);
    if (updated) parts.push(`${updated} updated`);
    if (skipped) parts.push(`${skipped} skipped (unit mismatch)`);
    setToast(
      parts.length
        ? `Shopping list updated: ${parts.join(", ")}.`
        : "Items already on your shopping list."
    );
  };

  const handleClearChat = () => {
    if (
      appState.chatMessages.length > 0 &&
      !window.confirm("Clear all chat messages?")
    ) {
      return;
    }
    onUpdate((prev) => ({ ...prev, chatMessages: [] }));
  };

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <p className="demo-note mb-4">
        Responses are mocked for this prototype — no real AI API yet. Chat history
        is saved in your browser.
      </p>

      <div className="flex min-h-[min(70dvh,600px)] flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] shadow-sm">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && !thinking && (
            <div className="empty-state py-10">
              <p className="empty-state-icon" aria-hidden>
                💬
              </p>
              <p className="empty-state-title">Ask PrepDeck anything</p>
              <p className="empty-state-text">
                Try meal prep plans, inventory ideas, or shopping suggestions.
                Tap a prompt below to get started.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              onAddSuggestedItems={handleAddSuggestedItems}
            />
          ))}
          {thinking && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span
                className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--salmon)]"
                aria-hidden
              />
              PrepDeck is thinking…
            </div>
          )}
        </div>

        <div className="border-t border-[var(--card-border)] px-3 py-3">
          <PromptChips
            prompts={EXAMPLE_PROMPTS}
            onSelect={sendMessage}
            disabled={thinking}
          />
        </div>

        <div className="border-t border-[var(--card-border)] p-3">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="text-xs text-[var(--text-muted)] underline-offset-2 hover:underline disabled:opacity-40"
            >
              Clear chat
            </button>
          </div>
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage(input)}
            disabled={thinking}
          />
        </div>
      </div>
    </>
  );
}
