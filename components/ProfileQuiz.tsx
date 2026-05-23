"use client";

import { useState } from "react";
import { ChipSelect } from "./ChipSelect";
import type { UserProfile } from "@/lib/types";

const APPLIANCE_OPTIONS = [
  "Microwave",
  "Stove",
  "Oven",
  "Air fryer",
  "Rice cooker",
  "Blender",
  "Toaster",
  "Slow cooker",
  "None / very limited appliances",
];

const AVOIDED_OPTIONS = [
  "Peanuts",
  "Dairy",
  "Gluten",
  "Pork",
  "Seafood",
  "Eggs",
  "None",
];

const GOAL_OPTIONS = [
  "High protein",
  "Budget-friendly",
  "Quick meals",
  "Healthy",
  "Vegetarian",
  "Bulk meal prep",
  "Low effort",
];

const SKILL_TIME_OPTIONS = [
  "Beginner, 15–30 minutes",
  "Beginner, 30–45 minutes",
  "Medium, 45–60 minutes",
  "Advanced, 60+ minutes",
];

const SIMPLICITY_OPTIONS = [
  "Very simple: 3–5 ingredients",
  "Simple: 5–7 ingredients",
  "Flexible: 8–10 ingredients",
  "I'm okay with extra spices/sauces",
];

const STEPS = [
  "Appliances",
  "Foods to avoid",
  "Eating goals",
  "Skill & time",
  "Simplicity",
];

interface ProfileQuizProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel?: () => void;
  startInQuiz?: boolean;
}

function parseSkillTime(combined: string): {
  cookingSkill: string;
  availableTime: string;
} {
  const parts = combined.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    return { cookingSkill: parts[0], availableTime: parts.slice(1).join(", ") };
  }
  return { cookingSkill: combined || "Beginner", availableTime: "30–45 minutes" };
}

export function ProfileQuiz({
  profile,
  onSave,
  onCancel,
  startInQuiz = false,
}: ProfileQuizProps) {
  const [mode, setMode] = useState<"summary" | "quiz">(
    startInQuiz || !profile.profileComplete ? "quiz" : "summary"
  );
  const [step, setStep] = useState(0);
  const [appliances, setAppliances] = useState(profile.appliances);
  const [avoidedFoods, setAvoidedFoods] = useState(profile.avoidedFoods);
  const [customAvoided, setCustomAvoided] = useState("");
  const [eatingGoals, setEatingGoals] = useState(profile.eatingGoals);
  const [skillTime, setSkillTime] = useState(() => {
    const match = SKILL_TIME_OPTIONS.find(
      (o) =>
        o.startsWith(profile.cookingSkill) &&
        o.includes(profile.availableTime.replace("–", "–"))
    );
    return match ?? `${profile.cookingSkill}, ${profile.availableTime}`;
  });
  const [simplicity, setSimplicity] = useState(profile.simplicityPreference);

  const progress = ((step + 1) / STEPS.length) * 100;

  const handleSave = () => {
    const { cookingSkill, availableTime } = parseSkillTime(skillTime);
    const allAvoided = [
      ...avoidedFoods.filter((f) => f !== "None"),
      ...customAvoided
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ];
    const finalAvoided = allAvoided.length ? allAvoided : ["None"];

    onSave({
      ...profile,
      appliances: appliances.length ? appliances : ["None / very limited appliances"],
      avoidedFoods: finalAvoided,
      eatingGoals: eatingGoals.length ? eatingGoals : ["Quick meals"],
      cookingSkill,
      availableTime,
      simplicityPreference: simplicity || SIMPLICITY_OPTIONS[1],
      profileComplete: true,
    });
    setMode("summary");
    setStep(0);
  };

  if (mode === "summary" && profile.profileComplete) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileSummaryBlock title="Appliances" items={profile.appliances} />
          <ProfileSummaryBlock title="Avoid" items={profile.avoidedFoods} />
          <ProfileSummaryBlock title="Goals" items={profile.eatingGoals} />
          <div className="rounded-xl bg-[#FAF6F0] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8B6F5C]">
              Skill & time
            </p>
            <p className="mt-1 text-sm text-[#3D3429]">
              {profile.cookingSkill} · {profile.availableTime}
            </p>
          </div>
          <div className="rounded-xl bg-[#FAF6F0] p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8B6F5C]">
              Simplicity
            </p>
            <p className="mt-1 text-sm text-[#3D3429]">{profile.simplicityPreference}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setAppliances(profile.appliances);
            setAvoidedFoods(profile.avoidedFoods);
            setEatingGoals(profile.eatingGoals);
            setSkillTime(`${profile.cookingSkill}, ${profile.availableTime}`);
            setSimplicity(profile.simplicityPreference);
            setMode("quiz");
            setStep(0);
          }}
          className="rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-5 py-2.5 text-sm font-medium text-[#6B5E52] hover:bg-[#F4E8DC]/60"
        >
          Edit profile
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="mb-2 flex justify-between text-xs text-[#8A7B6D]">
          <span>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E8DDD0]">
          <div
            className="h-full rounded-full bg-[#E8927C] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="min-h-[200px]">
        {step === 0 && (
          <div>
            <p className="mb-3 text-sm text-[#6B5E52]">
              What can you cook with in your dorm or apartment?
            </p>
            <ChipSelect
              options={APPLIANCE_OPTIONS}
              selected={appliances}
              onChange={setAppliances}
            />
          </div>
        )}
        {step === 1 && (
          <div>
            <p className="mb-3 text-sm text-[#6B5E52]">
              Any allergies or foods to avoid?
            </p>
            <ChipSelect
              options={AVOIDED_OPTIONS}
              selected={avoidedFoods}
              onChange={setAvoidedFoods}
            />
            <input
              type="text"
              value={customAvoided}
              onChange={(e) => setCustomAvoided(e.target.value)}
              placeholder="Other (comma-separated)"
              className="mt-3 w-full rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#E8927C] focus:ring-2 focus:ring-[#F4A896]/40"
            />
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="mb-3 text-sm text-[#6B5E52]">What are your eating goals?</p>
            <ChipSelect
              options={GOAL_OPTIONS}
              selected={eatingGoals}
              onChange={setEatingGoals}
            />
          </div>
        )}
        {step === 3 && (
          <div>
            <p className="mb-3 text-sm text-[#6B5E52]">
              How skilled are you, and how much time do you usually have?
            </p>
            <ChipSelect
              options={SKILL_TIME_OPTIONS}
              selected={skillTime ? [skillTime] : []}
              onChange={(v) => setSkillTime(v[0] ?? "")}
              single
            />
          </div>
        )}
        {step === 4 && (
          <div>
            <p className="mb-3 text-sm text-[#6B5E52]">
              How simple should your meals be?
            </p>
            <ChipSelect
              options={SIMPLICITY_OPTIONS}
              selected={simplicity ? [simplicity] : []}
              onChange={(v) => setSimplicity(v[0] ?? "")}
              single
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-xl border border-[#E8DDD0] px-5 py-2.5 text-sm font-medium text-[#6B5E52] hover:bg-[#F4E8DC]/60"
          >
            Back
          </button>
        )}
        {onCancel && step === 0 && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-5 py-2.5 text-sm text-[#8A7B6D] hover:bg-[#FAF6F0]"
          >
            Cancel
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-xl bg-[#E8927C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D97F68]"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-[#E8927C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D97F68]"
          >
            Save profile
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileSummaryBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl bg-[#FAF6F0] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8B6F5C]">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-[#6B5E52]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
