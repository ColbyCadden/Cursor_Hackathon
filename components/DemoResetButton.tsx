"use client";

import { useRouter } from "next/navigation";
import { resetDemoData } from "@/lib/storage";

interface DemoResetButtonProps {
  className?: string;
  onAfterReset?: () => void;
}

export function DemoResetButton({ className = "", onAfterReset }: DemoResetButtonProps) {
  const router = useRouter();

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset demo data?\n\nThis restores meals, Mealdeck, shopping list, and chat to defaults. Your login session stays active."
    );
    if (!confirmed) return;

    resetDemoData();
    onAfterReset?.();
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className={`btn-ghost w-full text-left ${className}`}
    >
      ↺ Reset demo data
    </button>
  );
}
