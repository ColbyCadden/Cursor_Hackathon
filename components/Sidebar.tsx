"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DemoResetButton } from "./DemoResetButton";
import { NavIcon, type NavIconName } from "./NavIcon";
import { PrepDeckBrand } from "./PrepDeckLogo";
import type { UserProfile } from "@/lib/types";

const navItems: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/mealdex", label: "Mealdex", icon: "mealdex" },
  { href: "/inventory", label: "Inventory", icon: "pantry" },
  { href: "/shopping-list", label: "Shopping list", icon: "shop" },
  { href: "/scanner", label: "Scanner", icon: "scan" },
  { href: "/chat", label: "AI Chat", icon: "chat" },
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
            (item.href === "/dashboard" && pathname === "/profile") ||
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
        <div className="mb-3 rounded-xl bg-[var(--background)] p-3 shadow-sm">
          <p className="text-sm font-semibold text-[var(--text)]">{profile.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{profile.cookingSkill} cook</p>
          <Link
            href="/dashboard#profile"
            onClick={onClose}
            className="mt-2 inline-block text-xs font-medium text-[var(--green-dark)] hover:underline"
          >
            Edit profile
          </Link>
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
