"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";
import { PromptChips } from "./PromptChips";
import { createId } from "@/lib/id";
import { generateAIResponse } from "@/lib/mockAI";
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

  const handleClearChat = () => {
    onUpdate((prev) => ({ ...prev, chatMessages: [] }));
  };

  return (
    <div className="flex min-h-[min(70dvh,600px)] flex-col rounded-2xl border-2 border-[var(--card-border)] bg-[var(--surface)] shadow-sm">
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <p className="text-center text-sm text-[var(--text-muted)]">
            Ask about meal prep, your inventory, or your Mealdex shop list.
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        {thinking && (
          <p className="text-sm text-[var(--text-muted)]">PrepDeck is thinking…</p>
        )}
      </div>

      <PromptChips prompts={EXAMPLE_PROMPTS} onSelect={sendMessage} />

      <div className="border-t border-[var(--card-border)] p-3">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={handleClearChat}
            className="text-xs text-[var(--text-muted)] underline"
          >
            Clear chat
          </button>
        </div>
        <ChatInput value={input} onChange={setInput} onSend={() => sendMessage(input)} />
      </div>
    </div>
  );
}
