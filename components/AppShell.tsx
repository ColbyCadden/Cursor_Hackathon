"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
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
    <div className="flex min-h-screen bg-[#FAF6F0]">
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 md:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <Sidebar profile={profile} onLogout={handleLogout} />
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          profile={profile}
          onLogout={handleLogout}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#E8DDD0] bg-[#FFF8F0]/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-[#E8DDD0] px-3 py-2 text-sm font-medium text-[#3D3429]"
            aria-label="Open menu"
          >
            ☰ Menu
          </button>
          <span className="font-bold text-[#3D3429]">PrepDeck</span>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
