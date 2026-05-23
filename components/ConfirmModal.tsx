"use client";

import type { ReactNode } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  primaryLabel: string;
  secondaryLabel?: string;
  cancelLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  children,
  primaryLabel,
  secondaryLabel,
  cancelLabel = "Cancel",
  onPrimary,
  onSecondary,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/35"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#E8DDD0] bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#3D3429]">{title}</h3>
        <div className="mt-3 text-sm text-[#6B5E52]">{children}</div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onPrimary}
            className="rounded-xl bg-[#E8927C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D97F68]"
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm font-medium text-[#6B5E52] hover:bg-[#F4E8DC]/60"
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm text-[#8A7B6D] hover:bg-[#FAF6F0]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
