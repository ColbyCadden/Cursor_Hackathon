"use client";

import type { ReactNode } from "react";

export interface ChoiceOption {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

interface ChoiceModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  options: ChoiceOption[];
  onSelect: (id: string) => void;
  onCancel: () => void;
}

const variantClass: Record<NonNullable<ChoiceOption["variant"]>, string> = {
  primary:
    "rounded-xl bg-[#E8927C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D97F68]",
  secondary:
    "rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm font-medium text-[#6B5E52] hover:bg-[#F4E8DC]/60",
  danger:
    "rounded-xl border border-[#E8DDD0] bg-white px-4 py-2.5 text-sm font-medium text-[#B85C4A] hover:bg-[#FFF5F3]",
  ghost:
    "rounded-xl px-4 py-2.5 text-sm text-[#8A7B6D] hover:bg-[#FAF6F0]",
};

export function ChoiceModal({
  open,
  title,
  children,
  options,
  onSelect,
  onCancel,
}: ChoiceModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/35"
        onClick={onCancel}
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E8DDD0] bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#3D3429]">{title}</h3>
        <div className="mt-3 text-sm text-[#6B5E52]">{children}</div>
        <div className="mt-6 flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={variantClass[option.variant ?? "secondary"]}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onCancel}
            className={variantClass.ghost}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
