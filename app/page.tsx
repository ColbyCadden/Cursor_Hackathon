"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAppState, resetAllAppData } from "@/lib/storage";
import { profileHasSignupData } from "@/lib/signupProfile";
import { PrepDeckBrand } from "@/components/PrepDeckLogo";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const state = getAppState();
    if (state.isLoggedIn && profileHasSignupData(state.profile)) {
      router.replace("/mealdex");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <PrepDeckBrand
          href=""
          size="xl"
          className="mx-auto mb-2 flex flex-col-reverse items-center gap-0 drop-shadow-md [&_div]:text-center [&_span]:leading-none [&>img]:-mt-4"
        />
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          Swipe Meals. Update Pantry. Shop Smarter.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
          Sign up once, personalize your kitchen, then discover meal cards and
          build a shopping list from what you save.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup/account"
            className="w-full min-h-[48px] rounded-xl bg-[var(--salmon)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--salmon-dark)] sm:w-auto"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="w-full min-h-[48px] rounded-xl border-2 border-[var(--card-border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)] hover:border-[var(--salmon)] sm:w-auto"
          >
            Log in
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            resetAllAppData();
            window.location.href = "/";
          }}
          className="mt-8 text-xs text-[var(--text-muted)] underline-offset-2 hover:underline"
        >
          Reset app data (testing)
        </button>
      </div>
    </div>
  );
}
