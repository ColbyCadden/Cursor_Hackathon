"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatContextSummary } from "./ChatContextSummary";
import { PromptChips } from "./PromptChips";
import { Toast } from "./Toast";
import { createId } from "@/lib/id";
import { applyAIAction } from "@/lib/appStateActions";
import { aiResponseToMealPlan } from "@/lib/ai/chatHelpers";
import { generateAIResponse } from "@/lib/mockAI";
import { mergeSuggestedIntoShoppingList } from "@/lib/shoppingListHelpers";
import type { AIResponse } from "@/lib/ai/chatHelpers";
import type { AppState, ChatAction, ChatMessage } from "@/lib/types";

const EXAMPLE_PROMPTS = [
  "What's in my inventory?",
  "I need to meal prep 8 meals.",
  "Create meals from my saved cards.",
  "Update my shopping list.",
  "Make this simpler.",
  "What should I meal prep this week?",
];

interface ChatInterfaceProps {
  appState: AppState;
  onUpdate: (updater: (prev: AppState) => AppState) => void;
}

function buildAssistantMessage(response: AIResponse): ChatMessage {
  return {
    id: createId("chat"),
    role: "assistant",
    content: response.text?.trim() || "Sorry, I didn't get a useful reply. Try again.",
    createdAt: new Date().toISOString(),
    suggestedItems: response.suggestedItems,
    mealPrepSteps: response.mealPrepSteps,
    actions: response.actions,
    actionsApplied: [],
    recipes: response.recipes,
    warnings: response.warnings,
    needsUserChoice: response.needsUserChoice,
  };
}

function appendChatMessages(
  messages: ChatMessage[],
  ...toAdd: ChatMessage[]
): ChatMessage[] {
  let next = messages;
  for (const message of toAdd) {
    if (next.some((existing) => existing.id === message.id)) continue;

    const messageTime = new Date(message.createdAt).getTime();
    const hasRecentDuplicate = next.some(
      (existing) =>
        existing.role === message.role &&
        existing.content === message.content &&
        Math.abs(messageTime - new Date(existing.createdAt).getTime()) < 5000
    );
    if (hasRecentDuplicate) continue;

    next = [...next, message];
  }
  return next;
}

export function ChatInterface({ appState, onUpdate }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<
    "gemini" | "groq" | "mock" | "quota" | "unconfigured" | "local" | null
  >(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const lastSendRef = useRef<{ text: string; at: number } | null>(null);

  const messages = appState.chatMessages;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const appendMessages = useCallback(
    (...toAdd: ChatMessage[]) => {
      onUpdate((prev) => ({
        ...prev,
        chatMessages: appendChatMessages(prev.chatMessages, ...toAdd),
      }));
    },
    [onUpdate]
  );

  const sendMessage = useCallback(
    async (text: string, stateOverride?: AppState) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;

      sendingRef.current = true;

      const now = Date.now();
      const lastSend = lastSendRef.current;
      if (lastSend?.text === trimmed && now - lastSend.at < 800) {
        sendingRef.current = false;
        return;
      }
      lastSendRef.current = { text: trimmed, at: now };

      setThinking(true);

      const baseState = stateOverride ?? appState;

      const userMessage: ChatMessage = {
        id: createId("chat"),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      onUpdate((prev) => {
        const nextMessages = appendChatMessages(prev.chatMessages, userMessage);
        if (nextMessages === prev.chatMessages) return prev;
        return { ...prev, chatMessages: nextMessages };
      });
      setInput("");

      const stateSnapshot: AppState = {
        ...baseState,
        chatMessages: [...baseState.chatMessages, userMessage],
      };

      try {
        const response = await generateAIResponse(trimmed, stateSnapshot);
        setAiSource(response.source ?? "mock");

        const assistantMessage = buildAssistantMessage(response);
        const mealPlan = aiResponseToMealPlan(response);

        onUpdate((prev) => {
          const nextMessages = appendChatMessages(
            prev.chatMessages,
            assistantMessage
          );
          return {
            ...prev,
            chatMessages: nextMessages,
            generatedMealPlan: mealPlan ?? prev.generatedMealPlan ?? null,
          };
        });
      } finally {
        setThinking(false);
        sendingRef.current = false;
      }
    },
    [appState, onUpdate]
  );

  const addConfirmationMessage = useCallback(
    (content: string) => {
      appendMessages({
        id: createId("chat"),
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      });
    },
    [appendMessages]
  );

  const handleAction = useCallback(
    async (messageId: string, action: ChatAction, index: number) => {
      if (sendingRef.current) return;

      const message = appState.chatMessages.find((m) => m.id === messageId);
      if (!message || message.actionsApplied?.includes(index)) return;

      const { state: nextState, confirmation, aiRevisionInstruction } = applyAIAction(
        appState,
        action
      );

      const updatedMessages = nextState.chatMessages.map((m) =>
        m.id === messageId
          ? { ...m, actionsApplied: [...(m.actionsApplied ?? []), index] }
          : m
      );

      onUpdate((prev) => ({
        ...nextState,
        chatMessages: prev.chatMessages.map((m) =>
          m.id === messageId
            ? {
                ...m,
                actionsApplied: [...(m.actionsApplied ?? []), index],
              }
            : m
        ),
      }));

      setToast(confirmation);

      if (aiRevisionInstruction) {
        await sendMessage(aiRevisionInstruction, {
          ...nextState,
          chatMessages: updatedMessages,
        });
        return;
      }

      addConfirmationMessage(confirmation);
    },
    [appState, onUpdate, sendMessage, addConfirmationMessage]
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

      <ChatContextSummary appState={appState} />

      <p className="demo-note mb-4">
        {aiSource === "gemini"
          ? "Powered by Gemini — meal plans & recipes from your app data."
          : aiSource === "groq"
            ? "Powered by Groq — Gemini was unavailable."
            : aiSource === "local"
              ? "Instant reply from your inventory & lists (no API used)."
              : aiSource === "quota"
                ? "Rate limits hit — wait a minute or use demo replies."
                : aiSource === "unconfigured"
                  ? "Demo mode — add GEMINI_API_KEY and/or GROQ_API_KEY to .env.local."
                  : aiSource === "mock"
                    ? "Demo mode — using offline replies."
                    : "Ask about meal prep, inventory, or shopping. Tap action buttons to update your list."}
      </p>

      <div className="flex min-h-[min(70dvh,600px)] flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] shadow-sm">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && !thinking && (
            <div className="empty-state py-10">
              <p className="empty-state-icon" aria-hidden>
                💬
              </p>
              <p className="empty-state-title">PrepDeck AI planner</p>
              <p className="empty-state-text">
                Try &quot;What&apos;s in my inventory?&quot; or tap a prompt below.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              onAddSuggestedItems={handleAddSuggestedItems}
              onAction={handleAction}
              actionsDisabled={thinking}
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
