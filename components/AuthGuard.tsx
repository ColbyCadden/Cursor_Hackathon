"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/useAppState";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { state, hydrated } = useAppState();

  useEffect(() => {
    if (hydrated && state && !state.isLoggedIn) {
      router.replace("/login");
    }
  }, [hydrated, state, router]);

  if (!hydrated || !state?.isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0]">
        <p className="text-sm text-[#8A7B6D]">Loading PrepDeck…</p>
      </div>
    );
  }

  return <>{children}</>;
}
