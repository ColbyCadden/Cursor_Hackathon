"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignupActions, SignupLayout } from "@/components/SignupLayout";
import { emailExists } from "@/lib/auth";
import { getAppState } from "@/lib/storage";
import { profileHasSignupData } from "@/lib/signupProfile";
import { getPendingSignup, savePendingSignup } from "@/lib/signupSession";

const CURRENT_PATH = "/signup/account";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function SignupAccountPage() {
  const router = useRouter();
  const pending = getPendingSignup();
  const [email, setEmail] = useState(pending.email ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(pending.name ?? "");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const state = getAppState();
    if (state.isLoggedIn && profileHasSignupData(state.profile)) {
      router.replace("/discover");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: string[] = [];
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_RE.test(normalizedEmail)) {
      nextErrors.push("Enter a valid university email address.");
    }
    if (password.length < 8) {
      nextErrors.push("Password must be at least 8 characters.");
    }
    if (name.trim().length < 2) {
      nextErrors.push("Enter your name.");
    }
    if (emailExists(normalizedEmail)) {
      nextErrors.push("An account with this email already exists. Try logging in.");
    }

    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    savePendingSignup({
      email: normalizedEmail,
      password,
      name: name.trim(),
    });
    router.push("/signup/equipment");
  };

  return (
    <SignupLayout
      currentPath={CURRENT_PATH}
      title="Create your account"
      subtitle="Use your email as your username. We'll personalize meal planning for your uni life."
    >
      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <ul className="mb-4 space-y-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[#6B5E52]"
            >
              University email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@university.ac.uk"
              className="w-full rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm text-[#3D3429] outline-none transition focus:border-[#E8927C] focus:ring-2 focus:ring-[#F4A896]/40"
            />
            <p className="mt-1 text-xs text-[#8A7B6D]">This is your login username</p>
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
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm text-[#3D3429] outline-none transition focus:border-[#E8927C] focus:ring-2 focus:ring-[#F4A896]/40"
            />
            <p className="mt-1 text-xs text-[#8A7B6D]">At least 8 characters</p>
          </div>

          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-[#6B5E52]"
            >
              First name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              autoComplete="given-name"
              className="w-full rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm text-[#3D3429] outline-none transition focus:border-[#E8927C] focus:ring-2 focus:ring-[#F4A896]/40"
            />
          </div>
        </div>

        <SignupActions />
      </form>

      <p className="mt-6 text-center text-sm text-[#8A7B6D]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#E8927C] hover:underline">
          Log in
        </Link>
      </p>
    </SignupLayout>
  );
}
