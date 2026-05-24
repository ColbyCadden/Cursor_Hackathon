"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/discover", label: "Discover", icon: "🔥" },
  { href: "/mealdex", label: "Mealdex", icon: "📚" },
  { href: "/inventory", label: "Pantry", icon: "🧊" },
  { href: "/shopping-list", label: "Shop", icon: "🛒" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/dashboard", label: "Home", icon: "🏠" },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--card-border)] bg-[var(--surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href === "/discover" && pathname === "/create");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold transition-colors ${
                active ? "text-[var(--green-dark)]" : "text-[var(--text-muted)]"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
