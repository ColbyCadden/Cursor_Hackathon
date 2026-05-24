"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAppState, loginWithCredentials, resetAllAppData } from "@/lib/storage";
import { profileHasSignupData } from "@/lib/signupProfile";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const state = getAppState();
    if (state.isLoggedIn && profileHasSignupData(state.profile)) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const result = loginWithCredentials(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#FAF6F0] via-[#FFF8F0] to-[#F4E8DC] px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4A896]/40 text-3xl shadow-sm">
              🍳
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#3D3429]">
            Log in
          </h1>
          <p className="mt-2 text-sm text-[#8A7B6D]">
            Use the email you signed up with
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-[#E8DDD0] bg-white/90 p-6 shadow-lg backdrop-blur-sm"
        >
          {error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

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
                required
                autoComplete="email"
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
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm text-[#3D3429] outline-none transition focus:border-[#E8927C] focus:ring-2 focus:ring-[#F4A896]/40"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full min-h-[48px] rounded-xl bg-[#E8927C] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D97F68]"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#8A7B6D]">
          New here?{" "}
          <Link
            href="/signup/account"
            className="font-medium text-[#E8927C] hover:underline"
          >
            Create an account
          </Link>
        </p>

        <p className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              resetAllAppData();
              window.location.href = "/";
            }}
            className="text-xs text-[#8A7B6D] underline-offset-2 hover:text-[#6B5E52] hover:underline"
          >
            Reset app data (start fresh for testing)
          </button>
        </p>
      </div>
    </div>
  );
}
