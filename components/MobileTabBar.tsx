"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type NavIconName } from "./NavIcon";

const tabs: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/mealdex", label: "Mealdex", icon: "mealdex" },
  { href: "/inventory", label: "Pantry", icon: "pantry" },
  { href: "/shopping-list", label: "Shop", icon: "shop" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/scanner", label: "Scan", icon: "scan" },
  { href: "/dashboard", label: "Home", icon: "home" },
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
            (tab.href === "/dashboard" && pathname === "/profile") ||
            (tab.href === "/mealdex" &&
              (pathname === "/discover" || pathname === "/create"));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors ${
                active ? "text-[var(--green-dark)]" : "text-[var(--text-muted)]"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  active ? "bg-[var(--salmon)]/25" : ""
                }`}
              >
                <NavIcon
                  name={tab.icon}
                  size={20}
                  strokeWidth={active ? 2.25 : 1.75}
                />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
