import type { RatingLevel } from "@/lib/types";

interface Props {
  value: RatingLevel;
}

export function PriceLevel({ value }: Props) {
  return (
    <div className="flex items-center" aria-label={`Price level ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`text-sm font-bold ${n <= value ? "text-[#5E9462]" : "text-[#C4B8A8]"}`}
        >
          $
        </span>
      ))}
    </div>
  );
}
