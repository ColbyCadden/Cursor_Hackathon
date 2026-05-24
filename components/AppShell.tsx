"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";
import { logoutUser } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";

interface AppShellProps {
  children: React.ReactNode;
  profile: UserProfile;
}

export function AppShell({ children, profile }: AppShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[var(--background)]">
      <div className="hidden w-64 shrink-0 md:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <Sidebar profile={profile} onLogout={handleLogout} />
        </div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] transform transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          profile={profile}
          onLogout={handleLogout}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--card-border)] bg-[var(--surface)]/95 px-3 py-3 backdrop-blur sm:px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[var(--card-border)] px-3 text-lg font-medium text-[var(--text)]"
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="font-bold text-[var(--text)]">PrepDeck</span>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 pb-20 sm:px-4 md:p-8 md:pb-8">
          {children}
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
