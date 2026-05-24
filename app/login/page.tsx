"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAppState,
  loginDemoUser,
  loginWithCredentials,
} from "@/lib/storage";
import { profileHasSignupData } from "@/lib/signupProfile";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const state = getAppState();
    if (state.isLoggedIn && profileHasSignupData(state.profile)) {
      router.replace("/discover");
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

    router.push("/discover");
  };

  const handleDemo = () => {
    loginDemoUser();
    router.push("/discover");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-[var(--background)] px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--salmon)]/40 text-3xl shadow-sm">
            🍳
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
            PrepDeck
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Simple cooking for busy students.
          </p>
        </div>

        <div className="demo-note mb-4 text-center">
          Prototype login — no real backend yet. Use demo mode for the fastest
          hackathon walkthrough.
        </div>

        <button
          type="button"
          onClick={handleDemo}
          className="btn-primary mb-4 w-full min-h-[52px] text-base shadow-sm"
        >
          Continue as demo user →
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--card-border)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--background)] px-3 text-[var(--text-muted)]">
              or sign in
            </span>
          </div>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 shadow-sm"
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
                className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]"
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
                className="input-field"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]"
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
                className="input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-secondary mt-6 w-full min-h-[48px]"
          >
            Log in with email
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          New here?{" "}
          <Link
            href="/signup/account"
            className="font-medium text-[var(--salmon-dark)] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
