import type { MealCard } from "@/lib/types";

interface MealPreviewCardProps {
  meal: MealCard;
  compact?: boolean;
}

export function MealPreviewCard({ meal, compact = false }: MealPreviewCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#E8DDD0] bg-gradient-to-br from-[#FFF8F0] to-[#F9EDE3] ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[#3D3429]">{meal.name}</h3>
        {meal.saved && (
          <span className="shrink-0 rounded-full bg-[#F4A896]/40 px-2 py-0.5 text-xs font-medium text-[#8B5A4A]">
            Saved
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {meal.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-[#6B5E52]"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#8A7B6D]">
        <span>⏱ {meal.estimatedTime}</span>
        <span>· {meal.difficulty}</span>
        <span>· {meal.nutritionEstimate}</span>
      </div>
      {!compact && (
        <p className="mt-2 text-xs text-[#8A7B6D]">
          Uses: {meal.mainIngredients.join(", ")}
        </p>
      )}
    </div>
  );
}
