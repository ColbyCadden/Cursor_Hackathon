"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ChatInterface } from "@/components/ChatInterface";
import { useAppState } from "@/lib/useAppState";

function ChatContent() {
  const { state, updateState } = useAppState();
  if (!state) return null;

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title="AI Meal Planner"
          subtitle="Ask PrepDeck to turn your inventory and saved meal ideas into simple meal prep plans."
        />

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
