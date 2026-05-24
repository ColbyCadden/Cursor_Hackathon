"use client";

import { useState } from "react";
import Image from "next/image";
import type { Meal } from "@/lib/types";
import { StarRating } from "./StarRating";
import { PriceLevel } from "./PriceLevel";
import { DietIcons } from "./DietIcons";

export const CARD_MAX_WIDTH = 360;

interface Props {
  meal: Meal;
  compact?: boolean;
  className?: string;
}

export function MealCard({ meal, compact = false, className = "" }: Props) {
  const [imgError, setImgError] = useState(false);
  const imageHeight = compact ? "h-24" : "h-[min(42vw,200px)] sm:h-[200px]";

  return (
    <article
      className={`overflow-hidden rounded-[20px] border-2 border-[#E8D5C4] bg-[#FFFBF7] shadow-md select-none ${className}`}
    >
      <div className={`relative w-full ${imageHeight} bg-[#F5F0E8]`}>
        {imgError ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F5F0E8] to-[#E8D5C4] text-5xl">
            🍽️
          </div>
        ) : (
          <Image
            src={meal.imageUri}
            alt={meal.name}
            fill
            draggable={false}
            className="pointer-events-none object-cover select-none [-webkit-user-drag:none]"
            sizes="(max-width: 430px) 100vw, 360px"
            unoptimized
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="border-t-2 border-[#E8A598] p-3.5">
        <h3
          className={`text-center font-bold text-[#3D3832] ${compact ? "text-sm line-clamp-2" : "text-lg"}`}
        >
          {meal.name}
        </h3>

        {!compact && (
          <>
            <div className="mt-3 flex justify-between px-1">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7268]">
                  Difficulty
                </span>
                <StarRating value={meal.difficulty} size="sm" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7268]">
                  Price
                </span>
                <PriceLevel value={meal.price} />
              </div>
            </div>
            <div className="mt-3">
              <DietIcons
                highProtein={meal.highProtein}
                highVegetables={meal.highVegetables}
              />
            </div>
          </>
        )}
      </div>
    </article>
  );
}
