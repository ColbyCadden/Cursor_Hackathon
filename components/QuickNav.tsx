import Link from "next/link";

const links = [
  { href: "/mealdex", label: "Mealdex", icon: "📚", desc: "Swipe & saved cards" },
  { href: "/shopping-list", label: "Shopping", icon: "🛒", desc: "Cart & inventory" },
  { href: "/chat", label: "AI Chat", icon: "💬", desc: "Meal planner" },
  { href: "/scanner", label: "Scanner", icon: "📷", desc: "Scan barcodes" },
  { href: "/profile", label: "Profile", icon: "👤", desc: "Preferences" },
];

export function QuickNav() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col rounded-xl border border-[#E8DDD0] bg-white/80 p-4 shadow-sm transition hover:border-[#E8A598] hover:bg-[#FFFBF7]"
        >
          <span className="text-2xl" aria-hidden>
            {item.icon}
          </span>
          <span className="mt-2 text-sm font-bold text-[#3D3429]">{item.label}</span>
          <span className="mt-0.5 text-xs text-[#8A7B6D]">{item.desc}</span>
        </Link>
      ))}
    </div>
  );
}
