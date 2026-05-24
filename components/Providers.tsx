"use client";

import { AppStateProvider } from "@/components/AppStateProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
