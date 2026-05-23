"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAppState, loginDemoUser } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (getAppState().isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleLogin = (e?: FormEvent) => {
    e?.preventDefault();
    loginDemoUser();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#FAF6F0] via-[#FFF8F0] to-[#F4E8DC] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4A896]/40 text-3xl shadow-sm">
            🍳
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#3D3429]">
            PrepDeck
          </h1>
          <p className="mt-2 text-sm font-medium text-[#8B6F5C]">
            Simple cooking for busy students.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#8A7B6D]">
            Track your groceries, swipe meal ideas, and build simple meal plans
            around student life.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-[#E8DDD0] bg-white/90 p-6 shadow-lg backdrop-blur-sm"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[#6B5E52]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm text-[#3D3429] outline-none transition focus:border-[#E8927C] focus:ring-2 focus:ring-[#F4A896]/40"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[#6B5E52]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm text-[#3D3429] outline-none transition focus:border-[#E8927C] focus:ring-2 focus:ring-[#F4A896]/40"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-[#E8927C] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D97F68]"
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => handleLogin()}
            className="mt-3 w-full rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-3 text-sm font-medium text-[#6B5E52] transition hover:bg-[#F4E8DC]/60"
          >
            Continue as demo user
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#8A7B6D]">
          Stage 1 prototype — no real authentication yet.
        </p>
      </div>
    </div>
  );
}
