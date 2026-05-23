"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { ChatInterface } from "@/components/ChatInterface";
import { useAppState } from "@/lib/useAppState";

function ChatContent() {
  const { state, updateState } = useAppState();
  if (!state) return null;

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[#3D3429] md:text-3xl">
            AI Meal Planner
          </h1>
          <p className="mt-2 text-[#8A7B6D]">
            Ask PrepDeck to turn your inventory and saved meal ideas into simple
            meal prep plans.
          </p>
        </header>

        <ChatInterface appState={state} onUpdate={updateState} />
      </div>
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatContent />
    </AuthGuard>
  );
}
