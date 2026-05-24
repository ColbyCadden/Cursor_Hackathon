import {
  Home,
  LayoutGrid,
  MessageCircle,
  Package,
  ScanLine,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type NavIconName =
  | "home"
  | "mealdex"
  | "pantry"
  | "shop"
  | "scan"
  | "chat";

const ICONS: Record<NavIconName, LucideIcon> = {
  home: Home,
  mealdex: LayoutGrid,
  pantry: Package,
  shop: ShoppingBag,
  scan: ScanLine,
  chat: MessageCircle,
};

interface NavIconProps {
  name: NavIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function NavIcon({
  name,
  size = 20,
  strokeWidth = 1.75,
  className = "",
}: NavIconProps) {
  const Icon = ICONS[name];
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden
    />
  );
}
