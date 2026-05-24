import type { RatingLevel } from "@/lib/types";

interface Props {
  value: RatingLevel;
  size?: "sm" | "md";
}

export function StarRating({ value, size = "md" }: Props) {
  const starSize = size === "sm" ? "text-sm" : "text-base";
  return (
    <div className="flex gap-0.5" aria-label={`Difficulty ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`${starSize} ${n <= value ? "text-[#D48476]" : "text-[#C4B8A8]"}`}
        >
          {n <= value ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}
