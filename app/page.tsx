"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAppState, resetAllAppData } from "@/lib/storage";
import { profileHasSignupData } from "@/lib/signupProfile";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const state = getAppState();
    if (state.isLoggedIn && profileHasSignupData(state.profile)) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#FAF6F0] via-[#FFF8F0] to-[#F4E8DC] px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <p className="mb-4 inline-block rounded-full bg-[#F4A896]/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#8B6F5C]">
          Built for university students
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#3D3429] sm:text-4xl">
          Meal plans, groceries & recipes — sorted
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#8A7B6D] sm:text-base">
          Track your pantry, plan weekly meals, build shopping lists, and discover
          recipes matched to your kitchen, diet, and schedule.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup/account"
            className="w-full min-h-[48px] rounded-xl bg-[#E8927C] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D97F68] sm:w-auto"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="w-full min-h-[48px] rounded-xl border border-[#E8DDD0] bg-white/90 px-6 py-3 text-sm font-semibold text-[#6B5E52] transition hover:bg-[#F4E8DC]/60 sm:w-auto"
          >
            Log in
          </Link>
        </div>

        <ul className="mt-10 flex flex-wrap justify-center gap-3 text-xs text-[#8A7B6D]">
          {["Meal planning", "Grocery lists", "Pantry inventory", "Personalized recipes"].map(
            (feature) => (
              <li
                key={feature}
                className="rounded-full border border-[#E8DDD0] bg-white/70 px-3 py-1.5"
              >
                {feature}
              </li>
            )
          )}
        </ul>

        <button
          type="button"
          onClick={() => {
            resetAllAppData();
            window.location.href = "/";
          }}
          className="mt-8 text-xs text-[#8A7B6D] underline-offset-2 hover:text-[#6B5E52] hover:underline"
        >
          Reset app data (start fresh for testing)
        </button>
      </div>
    </div>
  );
}
