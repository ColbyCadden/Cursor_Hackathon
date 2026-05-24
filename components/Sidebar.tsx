"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DemoResetButton } from "./DemoResetButton";
import { PrepDeckBrand } from "./PrepDeckLogo";
import type { UserProfile } from "@/lib/types";

const navItems = [
  { href: "/discover", label: "Discover", icon: "🔥" },
  { href: "/mealdex", label: "Mealdex", icon: "📚" },
  { href: "/shopping-list", label: "Shopping", icon: "🛒" },
  { href: "/create", label: "Create card", icon: "➕" },
  { href: "/chat", label: "AI Chat", icon: "💬" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/dashboard", label: "Home", icon: "🏠" },
];

interface SidebarProps {
  profile: UserProfile;
  onLogout: () => void;
  onClose?: () => void;
}

export function Sidebar({ profile, onLogout, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-[var(--card-border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--card-border)] p-5">
        <PrepDeckBrand
          href="/discover"
          onClick={onClose}
          size="md"
          showTagline
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--salmon)]/35 text-[var(--text)] shadow-sm"
                  : "text-[var(--text-muted)] hover:bg-[var(--background)]"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--card-border)] p-4">
        <div className="mb-3 rounded-xl bg-[var(--background)] p-3 shadow-sm">
          <p className="text-sm font-semibold text-[var(--text)]">{profile.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{profile.cookingSkill} cook</p>
        </div>
        <div className="mb-2 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--background)] p-2">
          <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Demo tools
          </p>
          <DemoResetButton />
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full min-h-[44px] rounded-xl border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--background)]"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
