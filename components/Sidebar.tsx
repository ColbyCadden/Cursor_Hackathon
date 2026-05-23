"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserProfile } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/chat", label: "AI Chat", icon: "💬" },
  { href: "/shopping-list", label: "Shopping List", icon: "🛒" },
];

interface SidebarProps {
  profile: UserProfile;
  onLogout: () => void;
  onClose?: () => void;
}

export function Sidebar({ profile, onLogout, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-[#E8DDD0] bg-[#FFF8F0]">
      <div className="border-b border-[#E8DDD0] p-5">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="block text-xl font-bold tracking-tight text-[#3D3429]"
        >
          PrepDeck
        </Link>
        <p className="mt-0.5 text-xs text-[#8A7B6D]">
          Simple cooking for busy students.
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#F4A896]/35 text-[#5C4033] shadow-sm"
                  : "text-[#6B5E52] hover:bg-[#F4E8DC]/60"
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

      <div className="border-t border-[#E8DDD0] p-4">
        <div className="mb-3 rounded-xl bg-white/70 p-3 shadow-sm">
          <p className="text-sm font-semibold text-[#3D3429]">{profile.name}</p>
          <p className="text-xs text-[#8A7B6D]">{profile.cookingSkill} cook</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-xl border border-[#E8DDD0] px-4 py-2 text-sm text-[#6B5E52] transition-colors hover:bg-[#F4E8DC]/50"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
