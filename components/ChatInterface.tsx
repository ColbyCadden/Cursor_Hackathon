"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatContextSummary } from "./ChatContextSummary";
import { ConfirmCookedRecipeModal } from "./ConfirmCookedRecipeModal";
import { PromptChips } from "./PromptChips";
import { NavIcon } from "./NavIcon";
import { Toast } from "./Toast";
import { createId } from "@/lib/id";
import { applyAIAction } from "@/lib/appStateActions";
import { aiResponseToMealPlan, shouldAutoSaveMealPlan } from "@/lib/ai/chatHelpers";
import { generateAIResponse } from "@/lib/mockAI";
import { applyInventoryUpdates, syncPantryState } from "@/lib/pantrySync";
import { mergeSuggestedIntoShoppingList } from "@/lib/shoppingListHelpers";
import {
  buildCookingConfirmRows,
  confirmCookedRecipe,
  enrichRecipeWithInventory,
} from "@/lib/cookingStateActions";
import type { AIResponse } from "@/lib/ai/chatHelpers";
import type { AppState, ChatAction, ChatMessage, AdaptedRecipe } from "@/lib/types";
import type { CookingConfirmRow, UsedIngredientConfirmation } from "@/lib/cookingStateActions";

const EXAMPLE_PROMPTS = [
  "What's in my pantry?",
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

function buildAssistantMessage(response: AIResponse, inventory: AppState["inventory"]): ChatMessage {
  const recipes = response.recipes?.map((r) =>
    enrichRecipeWithInventory(r, inventory)
  );
  return {
    id: createId("chat"),
    role: "assistant",
    content: response.text?.trim() || "Sorry, I didn't get a useful reply. Try again.",
    createdAt: new Date().toISOString(),
    suggestedItems: response.suggestedItems,
    mealPrepSteps: response.mealPrepSteps,
    inventoryUpdates: response.inventoryUpdates,
    actions: response.actions,
    actionsApplied: [],
    recipes,
    sharedIngredientsStrategy: response.sharedIngredientsStrategy,
    beforeAfterComparison: response.beforeAfterComparison,
    warnings: response.warnings,
    needsUserChoice: response.needsUserChoice,
    cookedRecipeKeys: [],
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
  const [cookTarget, setCookTarget] = useState<{
    messageId: string;
    recipeIndex: number;
    recipe: AdaptedRecipe;
    rows: CookingConfirmRow[];
  } | null>(null);
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

        const mealPlan = aiResponseToMealPlan(response);
        const autoSavePlan = shouldAutoSaveMealPlan(response);

        onUpdate((prev) => {
          const assistantMessage = buildAssistantMessage(response, prev.inventory);
          const nextMessages = appendChatMessages(
            prev.chatMessages,
            assistantMessage
          );
          return {
            ...prev,
            chatMessages: nextMessages,
            generatedMealPlan:
              autoSavePlan && mealPlan ? mealPlan : prev.generatedMealPlan ?? null,
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

  const handleApplyInventoryUpdates = (messageId: string) => {
    const message = appState.chatMessages.find((m) => m.id === messageId);
    if (!message?.inventoryUpdates?.length || message.inventoryUpdatesApplied) return;

    onUpdate((prev) => {
      const inventory = applyInventoryUpdates(
        prev.inventory,
        message.inventoryUpdates!
      );
      return syncPantryState({
        ...prev,
        inventory,
        chatMessages: prev.chatMessages.map((m) =>
          m.id === messageId ? { ...m, inventoryUpdatesApplied: true } : m
        ),
      });
    });

    setToast(
      `Pantry updated — deducted ${message.inventoryUpdates.length} ingredient(s).`
    );
  };

  const handleConfirmCooked = useCallback(
    (messageId: string, recipeIndex: number, recipe: AdaptedRecipe) => {
      const rows = buildCookingConfirmRows(recipe, appState.inventory);
      setCookTarget({ messageId, recipeIndex, recipe, rows });
    },
    [appState.inventory]
  );

  const handleConfirmCookSubmit = useCallback(
    (used: UsedIngredientConfirmation[]) => {
      if (!cookTarget) return;
      const { messageId, recipeIndex, recipe } = cookTarget;

      onUpdate((prev) =>
        confirmCookedRecipe(prev, recipe, used, { messageId, recipeIndex })
      );

      setCookTarget(null);
      setToast(`Pantry updated for ${recipe.displayTitle ?? recipe.title}.`);
    },
    [cookTarget, onUpdate]
  );

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
              ? "Instant reply from your pantry & lists (no API used)."
              : aiSource === "quota"
                ? "Rate limits hit — wait a minute or use demo replies."
                : aiSource === "unconfigured"
                  ? "Demo mode — add GEMINI_API_KEY and/or GROQ_API_KEY to .env.local."
                  : aiSource === "mock"
                    ? "Demo mode — using offline replies."
                    : "Ask about meal prep, pantry, or shopping. Tap action buttons to update your list."}
      </p>

      <div className="flex min-h-[min(70dvh,600px)] flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] shadow-sm">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && !thinking && (
            <div className="empty-state py-10">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--salmon)]/25 text-[var(--green-dark)]"
                aria-hidden
              >
                <NavIcon name="chat" size={24} strokeWidth={2} />
              </div>
              <p className="empty-state-title">Ask Chef</p>
              <p className="empty-state-text">
                Try &quot;What&apos;s in my pantry?&quot; or tap a prompt below.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              onAddSuggestedItems={handleAddSuggestedItems}
              onApplyInventoryUpdates={handleApplyInventoryUpdates}
              onConfirmCooked={handleConfirmCooked}
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

      <ConfirmCookedRecipeModal
        open={cookTarget !== null}
        recipe={cookTarget?.recipe ?? null}
        inventory={appState.inventory}
        rows={cookTarget?.rows ?? []}
        onConfirm={handleConfirmCookSubmit}
        onCancel={() => setCookTarget(null)}
      />
    </>
  );
}
