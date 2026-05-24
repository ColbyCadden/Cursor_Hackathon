"use client";

import Link from "next/link";
import { onboardingProgress } from "@/lib/signupSession";
import { PrepDeckLogo } from "@/components/PrepDeckLogo";

interface SignupLayoutProps {
  currentPath: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function SignupLayout({
  currentPath,
  title,
  subtitle,
  children,
}: SignupLayoutProps) {
  const progress = onboardingProgress(currentPath);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#FAF6F0] via-[#FFF8F0] to-[#F4E8DC] px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex flex-col items-center">
            <PrepDeckLogo size="lg" className="drop-shadow-sm" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#8B6F5C]">
              PrepDeck sign up
            </p>
          </Link>
        </div>

        <div className="rounded-2xl border border-[#E8DDD0] bg-white/90 p-6 shadow-lg backdrop-blur-sm">
          <nav
            className="mb-6 flex flex-wrap justify-center gap-2"
            aria-label="Sign-up progress"
          >
            {progress.map((step) => (
              <div
                key={step.label}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  step.active
                    ? "bg-[#E8927C] text-white"
                    : step.done
                      ? "bg-[#F4A896]/30 text-[#6B5E52]"
                      : "bg-[#FAF6F0] text-[#8A7B6D]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.active
                      ? "bg-white/25"
                      : step.done
                        ? "bg-[#E8927C]/20"
                        : "bg-[#E8DDD0]/60"
                  }`}
                >
                  {step.number}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </nav>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#3D3429]">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[#8A7B6D]">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

interface SignupActionsProps {
  backHref?: string;
  submitLabel?: string;
}

export function SignupActions({
  backHref,
  submitLabel = "Continue",
}: SignupActionsProps) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {backHref && (
        <Link
          href={backHref}
          className="rounded-xl border border-[#E8DDD0] px-5 py-2.5 text-sm font-medium text-[#6B5E52] transition hover:bg-[#F4E8DC]/60"
        >
          Back
        </Link>
      )}
      <button
        type="submit"
        className="ml-auto rounded-xl bg-[#E8927C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D97F68]"
      >
        {submitLabel}
      </button>
    </div>
  );
}
