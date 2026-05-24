"use client";

import type { BeforeAfterComparison, SharedIngredientsStrategy } from "@/lib/types";

interface SharedIngredientsStrategyCardProps {
  strategy: SharedIngredientsStrategy;
  beforeAfter?: BeforeAfterComparison;
}

export function SharedIngredientsStrategyCard({
  strategy,
  beforeAfter,
}: SharedIngredientsStrategyCardProps) {
  const reused = strategy.reusedIngredients ?? [];

  return (
    <div className="mt-3 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Shared ingredients strategy
      </p>

      {strategy.summary && (
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--text)]">
          {strategy.summary}
        </p>
      )}

      {reused.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
          {reused.map((item) => (
            <li key={item.name}>
              · <span className="font-medium text-[var(--text)]">{item.name}</span>
              {item.usedInMeals.length > 0 && (
                <>
                  {" "}
                  reused in {item.usedInMeals.length} meal
                  {item.usedInMeals.length === 1 ? "" : "s"}
                  {item.usedInMeals.length <= 3
                    ? `: ${item.usedInMeals.join(", ")}`
                    : ""}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {strategy.preservedVariety && strategy.preservedVariety.length > 0 && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Meal variety preserved:{" "}
          {strategy.preservedVariety.join(" · ")}
        </p>
      )}

      {strategy.secondaryChanges && strategy.secondaryChanges.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-[var(--text-muted)]">
          {strategy.secondaryChanges.map((change) => (
            <li key={`${change.original}-${change.replacement}`}>
              · Swapped {change.original} → {change.replacement}
              {change.mealsAffected.length
                ? ` in ${change.mealsAffected.join(", ")}`
                : ""}
            </li>
          ))}
        </ul>
      )}

      {strategy.coreChanges && strategy.coreChanges.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-amber-800">
          {strategy.coreChanges.map((change, index) => (
            <li key={`${change.mealTitle ?? change.mealId ?? index}-${index}`}>
              · {change.mealTitle ?? "Meal"}
              {change.originalCoreIngredient && change.newCoreIngredient
                ? `: ${change.originalCoreIngredient} → ${change.newCoreIngredient}`
                : ""}
              {change.reason ? ` — ${change.reason}` : ""}
            </li>
          ))}
        </ul>
      )}

      {beforeAfter && (beforeAfter.before?.length || beforeAfter.after?.length) && (
        <div className="mt-3 grid gap-2 border-t border-[var(--card-border)] pt-2 sm:grid-cols-2">
          {beforeAfter.before && beforeAfter.before.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                Before
              </p>
              <ul className="mt-0.5 space-y-0.5 text-xs text-[var(--text-muted)]">
                {beforeAfter.before.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </div>
          )}
          {beforeAfter.after && beforeAfter.after.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                After
              </p>
              <ul className="mt-0.5 space-y-0.5 text-xs text-[var(--text-muted)]">
                {beforeAfter.after.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {beforeAfter?.result && beforeAfter.result.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-green-800">
          {beforeAfter.result.map((line) => (
            <li key={line}>✓ {line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
