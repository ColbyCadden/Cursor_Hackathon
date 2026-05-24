"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import type { Meal } from "@/lib/types";
import { MealCard, CARD_MAX_WIDTH } from "./MealCard";

const SWIPE_THRESHOLD = CARD_MAX_WIDTH * 0.28;

interface Props {
  meals: Meal[];
  onSwipeLeft: (id: string) => void;
  onSwipeRight: (id: string) => void;
}

export function SwipeDeck({ meals, onSwipeLeft, onSwipeRight }: Props) {
  const top = meals[0];
  const next = meals[1];

  if (!top) {
    return (
      <div className="empty-state px-4 py-10">
        <p className="empty-state-icon" aria-hidden>
          ✓
        </p>
        <p className="empty-state-title">All caught up!</p>
        <p className="empty-state-text">
          You&apos;ve swiped through every card. Create a custom meal or reset
          swipes from Mealdex to browse again.
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-[min(100%,360px)] flex-col items-center">
      {next && (
        <div className="absolute top-0 w-full scale-[0.95] opacity-65">
          <MealCard meal={next} />
        </div>
      )}
      <SwipeableCard
        key={top.id}
        meal={top}
        onSwipeLeft={() => onSwipeLeft(top.id)}
        onSwipeRight={() => onSwipeRight(top.id)}
      />
    </div>
  );
}

function SwipeableCard({
  meal,
  onSwipeLeft,
  onSwipeRight,
}: {
  meal: Meal;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const [exiting, setExiting] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const saveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const flyOut = (direction: "left" | "right") => {
    if (exiting) return;
    setExiting(true);
    const to = direction === "right" ? 500 : -500;
    animate(x, to, { duration: 0.22, onComplete: () => {
      if (direction === "right") onSwipeRight();
      else onSwipeLeft();
    }});
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) flyOut("right");
    else if (info.offset.x < -SWIPE_THRESHOLD) flyOut("left");
    else animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  };

  return (
    <>
      <motion.div
        className="relative z-10 w-full touch-pan-y"
        style={{ x, rotate }}
        drag={exiting ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={onDragEnd}
      >
        <MealCard meal={meal} />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute left-4 top-12 z-20 rounded-lg border-[3px] border-[#7BAE7F] px-3 py-2 -rotate-12"
        style={{ opacity: saveOpacity }}
      >
        <span className="text-xl font-extrabold tracking-widest text-[#7BAE7F]">
          SAVE
        </span>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-4 top-12 z-20 rounded-lg border-[3px] border-[#D48476] px-3 py-2 rotate-12"
        style={{ opacity: skipOpacity }}
      >
        <span className="text-xl font-extrabold tracking-widest text-[#D48476]">
          SKIP
        </span>
      </motion.div>

      <div className="relative z-10 mt-6 flex justify-center gap-12">
        <ActionButton label="Skip" icon="✕" color="#C4B8A8" onClick={() => flyOut("left")} />
        <ActionButton label="Mealdex" icon="♥" color="#7BAE7F" onClick={() => flyOut("right")} />
      </div>
    </>
  );
}

function ActionButton({
  label,
  icon,
  color,
  onClick,
}: {
  label: string;
  icon: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5"
    >
      <span
        className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 bg-white text-2xl shadow-sm"
        style={{ borderColor: color, color }}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold text-[#7A7268]">{label}</span>
    </button>
  );
}
