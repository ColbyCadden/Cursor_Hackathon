"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/useAppState";
import { profileHasSignupData } from "@/lib/signupProfile";
import {
  getPendingSignup,
  onboardingResumePath,
} from "@/lib/signupSession";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { state, hydrated } = useAppState();

  useEffect(() => {
    if (!hydrated || !state) return;

    if (!state.isLoggedIn) {
      router.replace("/login");
      return;
    }

    if (!profileHasSignupData(state.profile)) {
      const pending = getPendingSignup();
      router.replace(onboardingResumePath(pending));
    }
  }, [hydrated, state, router]);

  if (!hydrated || !state?.isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--text-muted)]">Loading PrepDeck…</p>
      </div>
    );
  }

  if (!profileHasSignupData(state.profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--text-muted)]">Continuing setup…</p>
      </div>
    );
  }

  if (!profileHasSignupData(state.profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0]">
        <p className="text-sm text-[#8A7B6D]">Continuing setup…</p>
      </div>
    );
  }

  return <>{children}</>;
}
