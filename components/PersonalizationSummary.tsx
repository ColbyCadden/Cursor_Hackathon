"use client";

import type { UserProfile } from "@/lib/types";
import { buildPersonalizedExperience } from "@/lib/signupProfile";

interface PersonalizationSummaryProps {
  profile: UserProfile;
}

export function PersonalizationSummary({ profile }: PersonalizationSummaryProps) {
  const experience = buildPersonalizedExperience(profile);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Diet" value={experience.stats.diet} />
        <StatCard label="Weekly cooking" value={experience.stats.time} />
        <StatCard label="Skill" value={experience.stats.skill} />
        <StatCard label="Recipes" value={experience.stats.ingredients} />
      </div>

      <div className="rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-3 text-sm text-[#6B5E52]">
        <span className="font-semibold text-[#8B6F5C]">Your setup · </span>
        {experience.stats.equipment} · {experience.stats.equipmentCount} items
        selected
      </div>

      <a
        href="#profile"
        className="inline-flex rounded-xl border border-[#E8DDD0] bg-white px-5 py-2.5 text-sm font-medium text-[#6B5E52] transition hover:bg-[#F4E8DC]/60"
      >
        Edit profile settings
      </a>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#FAF6F0] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8B6F5C]">
        {label}
      </p>
      <p className="mt-1 text-sm leading-snug text-[#3D3429]">{value}</p>
    </div>
  );
}
