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
  "Update my shopping list.",
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

      // Snapshot state at send time so the mock AI uses current data.
      const stateSnapshot = { ...appState, chatMessages: [...appState.chatMessages, userMessage] };

      try {
        const response = await generateAIResponse(trimmed, stateSnapshot);

        const assistantMessage: ChatMessage = {
          id: createId("chat"),
          role: "assistant",
          content: response.text,
          createdAt: new Date().toISOString(),
          suggestedItems: response.suggestedItems,
          mealPrepSteps: response.mealPrepSteps,
          suggestedItemsAdded: false,
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

  const handleAddSuggested = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.suggestedItems?.length || msg.suggestedItemsAdded) return;

    const { list, added, updated } = mergeSuggestedIntoShoppingList(
      appState.shoppingList,
      msg.suggestedItems
    );

    onUpdate((prev) => ({
      ...prev,
      shoppingList: list,
      chatMessages: prev.chatMessages.map((m) =>
        m.id === messageId ? { ...m, suggestedItemsAdded: true } : m
      ),
    }));

    const count = added + updated;
    setToast(
      count > 0
        ? `${count} item(s) added to your shopping list.`
        : "Items already on your list — no duplicates added."
    );
  };

  const handleClearChat = () => {
    onUpdate((prev) => ({ ...prev, chatMessages: [] }));
  };

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="rounded-2xl border border-[#E8DDD0] bg-white/80 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E8DDD0] px-4 py-3">
          <p className="text-sm text-[#8A7B6D]">
            Uses your profile, inventory & saved meals
          </p>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="text-xs font-medium text-[#8A7B6D] hover:text-[#B85C4A]"
            >
              Clear chat
            </button>
          )}
        </div>

        <div
          ref={scrollRef}
          className="max-h-[420px] min-h-[280px] space-y-4 overflow-y-auto p-4 sm:p-6"
        >
          {messages.length === 0 && !thinking && (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <span className="text-4xl" aria-hidden>
                🍽️
              </span>
              <p className="mt-3 text-sm font-medium text-[#6B5E52]">
                Ask for a meal plan, inventory ideas, or shopping help
              </p>
              <p className="mt-1 max-w-sm text-xs text-[#8A7B6D]">
                I&apos;ll use your cooking profile, what&apos;s in your kitchen,
                and saved meal ideas — kept simple for student life.
              </p>
              <div className="mt-5">
                <PromptChips
                  prompts={EXAMPLE_PROMPTS.slice(0, 4)}
                  onSelect={sendMessage}
                />
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              onAddSuggested={
                message.role === "assistant" ? handleAddSuggested : undefined
              }
            />
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-3 text-sm text-[#8A7B6D]">
                <span className="inline-flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#E8927C]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#E8927C] [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#E8927C] [animation-delay:300ms]" />
                  </span>
                  Thinking…
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#E8DDD0] p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#8A7B6D]">
            Try asking
          </p>
          <PromptChips
            prompts={EXAMPLE_PROMPTS}
            onSelect={sendMessage}
            disabled={thinking}
          />
          <div className="mt-4">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage(input)}
              disabled={thinking}
            />
          </div>
        </div>
      </div>
    </>
  );
}