"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignupActions, SignupLayout } from "@/components/SignupLayout";
import { COOKING_SKILL } from "@/lib/signupConstants";
import {
  getPendingSignup,
  requirePendingAccount,
  savePendingSignup,
} from "@/lib/signupSession";

const CURRENT_PATH = "/signup/skill";

export default function SignupSkillPage() {
  const router = useRouter();
  const pending = getPendingSignup();
  const [selected, setSelected] = useState(pending.cooking_skill_level ?? "");

  useEffect(() => {
    const redirect = requirePendingAccount();
    if (redirect) router.replace(redirect);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !(selected in COOKING_SKILL)) {
      alert("Please select your cooking skill level.");
      return;
    }
    savePendingSignup({ cooking_skill_level: selected });
    router.push("/signup/ingredients");
  };

  return (
    <SignupLayout
      currentPath={CURRENT_PATH}
      title="Your cooking skill level"
      subtitle="No judgment — we'll match recipe difficulty to where you're at."
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          {Object.entries(COOKING_SKILL).map(([value, label]) => (
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
                name="cooking_skill_level"
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
        <SignupActions backHref="/signup/time" />
      </form>
    </SignupLayout>
  );
}
