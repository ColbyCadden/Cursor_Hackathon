"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type NavIconName } from "./NavIcon";
import { PrepDeckBrand } from "./PrepDeckLogo";
import type { UserProfile } from "@/lib/types";

const navItems: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/mealdex", label: "MealDeck", icon: "mealdex" },
  { href: "/inventory", label: "Pantry", icon: "pantry" },
  { href: "/shopping-list", label: "Shopping list", icon: "shop" },
  { href: "/scanner", label: "Scanner", icon: "scan" },
  { href: "/chat", label: "Chef", icon: "chat" },
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
      <div className="border-b border-[var(--card-border)] py-5 pl-3 pr-4">
        <PrepDeckBrand
          href="/mealdex"
          onClick={onClose}
          size="md"
          showTagline
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/mealdex" &&
              (pathname === "/discover" || pathname === "/create"));
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
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  active ? "bg-[var(--salmon)]/30" : "bg-transparent"
                }`}
              >
                <NavIcon
                  name={item.icon}
                  size={18}
                  strokeWidth={active ? 2.25 : 1.75}
                />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--card-border)] p-4">
        <div
          className={`mb-3 rounded-xl border p-3 shadow-sm bg-[#f5d9a8]/40 border-[#e8c47a]/50 ${
            pathname === "/dashboard" ? "ring-1 ring-[#e8c47a]/70" : ""
          }`}
        >
          <p className="text-sm font-semibold text-[var(--text)]">{profile.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{profile.cookingSkill} cook</p>
          <Link
            href="/dashboard"
            onClick={onClose}
            className={`mt-2 inline-block text-xs font-medium hover:underline ${
              pathname === "/dashboard"
                ? "font-semibold text-[var(--text)]"
                : "text-[var(--green-dark)]"
            }`}
          >
            View profile
          </Link>
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
