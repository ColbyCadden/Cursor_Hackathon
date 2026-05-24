"use client";

import { useEffect, useState } from "react";
import {
  COOKING_EQUIPMENT,
  COOKING_SKILL,
  COOKING_TIME_PER_WEEK,
  EATING_HABITS,
  INGREDIENT_PREFERENCE,
} from "@/lib/signupConstants";
import { updateRegisteredUser } from "@/lib/auth";
import { pendingSignupToProfile } from "@/lib/signupProfile";
import type { UserProfile } from "@/lib/types";

interface ProfileSettingsProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

export function ProfileSettings({ profile, onSave }: ProfileSettingsProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [eatingHabits, setEatingHabits] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [skill, setSkill] = useState("");
  const [ingredients, setIngredients] = useState("");

  useEffect(() => {
    setEquipment(profile.cooking_equipment ?? []);
    setEatingHabits(profile.eating_habits ?? "");
    setCookingTime(profile.cooking_time_per_week ?? "");
    setSkill(profile.cooking_skill_level ?? "");
    setIngredients(profile.ingredient_preference ?? "");
  }, [profile]);

  const toggleEquipment = (value: string) => {
    setEquipment((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    const validEquipment = equipment.filter((v) => v in COOKING_EQUIPMENT);
    if (
      !validEquipment.length ||
      !(eatingHabits in EATING_HABITS) ||
      !(cookingTime in COOKING_TIME_PER_WEEK) ||
      !(skill in COOKING_SKILL) ||
      !(ingredients in INGREDIENT_PREFERENCE)
    ) {
      setError("Please complete all profile fields.");
      return;
    }

    if (profile.email) {
      updateRegisteredUser(profile.email, {
        name: profile.name,
        cooking_equipment: validEquipment,
        eating_habits: eatingHabits,
        cooking_time_per_week: cookingTime,
        cooking_skill_level: skill,
        ingredient_preference: ingredients,
        onboarding_completed: true,
      });
    }

    const updatedProfile = pendingSignupToProfile({
      email: profile.email,
      name: profile.name,
      cooking_equipment: validEquipment,
      eating_habits: eatingHabits,
      cooking_time_per_week: cookingTime,
      cooking_skill_level: skill,
      ingredient_preference: ingredients,
    });

    onSave(updatedProfile);
    setSaved(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Profile updated.
        </p>
      )}

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-[#6B5E52]">
          Cooking equipment
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(COOKING_EQUIPMENT).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                equipment.includes(value)
                  ? "border-[#E8927C] bg-[#F4A896]/20"
                  : "border-[#E8DDD0] bg-[#FAF6F0]"
              }`}
            >
              <input
                type="checkbox"
                checked={equipment.includes(value)}
                onChange={() => toggleEquipment(value)}
                className="accent-[#E8927C]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <RadioGroup
        legend="Eating habits"
        name="eating_habits"
        options={EATING_HABITS}
        value={eatingHabits}
        onChange={setEatingHabits}
      />
      <RadioGroup
        legend="Time cooking per week"
        name="cooking_time_per_week"
        options={COOKING_TIME_PER_WEEK}
        value={cookingTime}
        onChange={setCookingTime}
      />
      <RadioGroup
        legend="Cooking skill"
        name="cooking_skill_level"
        options={COOKING_SKILL}
        value={skill}
        onChange={setSkill}
      />
      <RadioGroup
        legend="How complex should recipes be?"
        name="ingredient_preference"
        options={INGREDIENT_PREFERENCE}
        value={ingredients}
        onChange={setIngredients}
      />

      <button
        type="submit"
        className="rounded-xl bg-[#E8927C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D97F68]"
      >
        Save profile
      </button>
    </form>
  );
}

function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-[#6B5E52]">
        {legend}
      </legend>
      <div className="space-y-2">
        {Object.entries(options).map(([optValue, label]) => (
          <label
            key={optValue}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
              value === optValue
                ? "border-[#E8927C] bg-[#F4A896]/20"
                : "border-[#E8DDD0] bg-[#FAF6F0]"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={optValue}
              checked={value === optValue}
              onChange={() => onChange(optValue)}
              required
              className="accent-[#E8927C]"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
