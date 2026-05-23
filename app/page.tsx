"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAppState } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const state = getAppState();
    router.replace(state.isLoggedIn ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0]">
      <p className="text-sm text-[#8A7B6D]">Loading PrepDeck…</p>
    </div>
  );
}
