"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignupActions, SignupLayout } from "@/components/SignupLayout";
import { completeSignup } from "@/lib/signupProfile";
import { INGREDIENT_PREFERENCE } from "@/lib/signupConstants";
import {
  getPendingSignup,
  requirePendingAccount,
} from "@/lib/signupSession";

const CURRENT_PATH = "/signup/ingredients";

export default function SignupIngredientsPage() {
  const router = useRouter();
  const pending = getPendingSignup();
  const [selected, setSelected] = useState(pending.ingredient_preference ?? "");

  useEffect(() => {
    const redirect = requirePendingAccount();
    if (redirect) router.replace(redirect);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !(selected in INGREDIENT_PREFERENCE)) {
      alert("Please choose how complex you want your recipes to be.");
      return;
    }

    const finalPending = { ...getPendingSignup(), ingredient_preference: selected };
    try {
      completeSignup(finalPending);
      router.replace("/mealdex");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not create account.");
    }
  };

  return (
    <SignupLayout
      currentPath={CURRENT_PATH}
      title="How complex should recipes be?"
      subtitle="Some recipes use just a few ingredients; others need a fuller shopping list. Pick what suits you."
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          {Object.entries(INGREDIENT_PREFERENCE).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                selected === value
                  ? "border-[#E8927C] bg-[#F4A896]/20"
                  : "border-[#E8DDD0] bg-[#FAF6F0] hover:bg-[#F4E8DC]/40"
              }`}
            >
              <input
                type="radio"
                name="ingredient_preference"
                value={value}
                checked={selected === value}
                onChange={() => setSelected(value)}
                required
                className="accent-[#E8927C]"
              />
              {label}
            </label>
          ))}
        </div>
        <SignupActions
          backHref="/signup/skill"
          submitLabel="Create my account"
        />
      </form>
    </SignupLayout>
  );
}
