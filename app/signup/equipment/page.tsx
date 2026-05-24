"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignupActions, SignupLayout } from "@/components/SignupLayout";
import { COOKING_EQUIPMENT } from "@/lib/signupConstants";
import {
  getPendingSignup,
  requirePendingAccount,
  savePendingSignup,
} from "@/lib/signupSession";

const CURRENT_PATH = "/signup/equipment";

export default function SignupEquipmentPage() {
  const router = useRouter();
  const pending = getPendingSignup();
  const [selected, setSelected] = useState<string[]>(
    pending.cooking_equipment ?? []
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const redirect = requirePendingAccount();
    if (redirect) router.replace(redirect);
  }, [router]);

  const toggleEquipment = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = selected.filter((v) => v in COOKING_EQUIPMENT);
    if (!valid.length) {
      setError("Select at least one piece of equipment you have access to.");
      return;
    }
    savePendingSignup({ cooking_equipment: valid });
    router.push("/signup/diet");
  };

  return (
    <SignupLayout
      currentPath={CURRENT_PATH}
      title="What can you cook with?"
      subtitle="Select everything you have access to in your flat, halls, or shared kitchen."
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(COOKING_EQUIPMENT).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                selected.includes(value)
                  ? "border-[#E8927C] bg-[#F4A896]/20"
                  : "border-[#E8DDD0] bg-[#FAF6F0] hover:bg-[#F4E8DC]/40"
              }`}
            >
              <input
                type="checkbox"
                name="cooking_equipment"
                value={value}
                checked={selected.includes(value)}
                onChange={() => toggleEquipment(value)}
                className="accent-[#E8927C]"
              />
              {label}
            </label>
          ))}
        </div>

        <SignupActions backHref="/signup/account" />
      </form>
    </SignupLayout>
  );
}
