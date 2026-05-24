"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignupActions, SignupLayout } from "@/components/SignupLayout";
import { EATING_HABITS } from "@/lib/signupConstants";
import {
  getPendingSignup,
  requirePendingAccount,
  savePendingSignup,
} from "@/lib/signupSession";

const CURRENT_PATH = "/signup/diet";

export default function SignupDietPage() {
  const router = useRouter();
  const pending = getPendingSignup();
  const [selected, setSelected] = useState(pending.eating_habits ?? "");

  useEffect(() => {
    const redirect = requirePendingAccount();
    if (redirect) router.replace(redirect);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !(selected in EATING_HABITS)) {
      alert("Please select your eating habits.");
      return;
    }
    savePendingSignup({ eating_habits: selected });
    router.push("/signup/time");
  };

  return (
    <SignupLayout
      currentPath={CURRENT_PATH}
      title="How do you eat?"
      subtitle="We'll suggest recipes and shopping lists that match your diet."
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          {Object.entries(EATING_HABITS).map(([value, label]) => (
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
                name="eating_habits"
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
        <SignupActions backHref="/signup/equipment" />
      </form>
    </SignupLayout>
  );
}
