"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/useAppState";

const examplePrompts = [
  "I need to meal prep 8 meals.",
  "What can I cook with my inventory?",
  "Use fewer ingredients.",
  "Make this simpler.",
];

function ChatContent() {
  const { state } = useAppState();
  if (!state) return null;

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[#3D3429] md:text-3xl">
            AI Meal Planner
          </h1>
          <p className="mt-2 text-[#8A7B6D]">
            Ask PrepDeck to turn your inventory and saved meals into simple meal
            prep plans.
          </p>
        </header>

        <div className="rounded-2xl border border-[#E8DDD0] bg-white/80 shadow-sm">
          <div className="border-b border-[#E8DDD0] p-4">
            <p className="text-sm text-[#8A7B6D]">
              Chat with your meal planner — coming in Stage 3
            </p>
          </div>

          <div className="min-h-[280px] space-y-4 p-6">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#F4A896]/35 px-4 py-3 text-sm text-[#3D3429]">
                What can I cook with chicken and rice this week?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-3 text-sm text-[#8A7B6D]">
                Mocked AI responses will be added in Stage 3. Your inventory
                and saved meals will power personalized suggestions.
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8DDD0] p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#8A7B6D]">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-full border border-[#E8DDD0] bg-[#FAF6F0] px-3 py-1.5 text-xs text-[#6B5E52] opacity-70"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                disabled
                placeholder="Type a message… (Stage 3)"
                className="flex-1 cursor-not-allowed rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm text-[#8A7B6D] opacity-70"
              />
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl bg-[#E8927C]/50 px-5 py-2.5 text-sm font-medium text-white opacity-70"
              >
                Send
              </button>
            </div>
          </div>
        </div>
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
