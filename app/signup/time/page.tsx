"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignupActions, SignupLayout } from "@/components/SignupLayout";
import { COOKING_TIME_PER_WEEK } from "@/lib/signupConstants";
import {
  getPendingSignup,
  requirePendingAccount,
  savePendingSignup,
} from "@/lib/signupSession";

const CURRENT_PATH = "/signup/time";

export default function SignupTimePage() {
  const router = useRouter();
  const pending = getPendingSignup();
  const [selected, setSelected] = useState(pending.cooking_time_per_week ?? "");

  useEffect(() => {
    const redirect = requirePendingAccount();
    if (redirect) router.replace(redirect);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !(selected in COOKING_TIME_PER_WEEK)) {
      alert("Please select how much time you have for cooking each week.");
      return;
    }
    savePendingSignup({ cooking_time_per_week: selected });
    router.push("/signup/skill");
  };

  return (
    <SignupLayout
      currentPath={CURRENT_PATH}
      title="Time for cooking each week"
      subtitle="Be realistic — we'll plan meals that fit your schedule."
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          {Object.entries(COOKING_TIME_PER_WEEK).map(([value, label]) => (
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
                name="cooking_time_per_week"
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
        <SignupActions backHref="/signup/diet" />
      </form>
    </SignupLayout>
  );
}
