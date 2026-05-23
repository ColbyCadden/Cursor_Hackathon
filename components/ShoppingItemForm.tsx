"use client";

import { useState } from "react";
import {
  SHOPPING_CATEGORIES,
  type ShoppingCategory,
} from "@/lib/types";

export interface ShoppingItemFormData {
  name: string;
  amount: string;
  unit: string;
  category: ShoppingCategory;
  required: boolean;
}

const emptyForm: ShoppingItemFormData = {
  name: "",
  amount: "",
  unit: "",
  category: "Protein",
  required: true,
};

interface ShoppingItemFormProps {
  initial?: ShoppingItemFormData;
  onSave: (data: ShoppingItemFormData) => void;
  onCancel: () => void;
  title: string;
}

export function ShoppingItemForm({
  initial,
  onSave,
  onCancel,
  title,
}: ShoppingItemFormProps) {
  const [form, setForm] = useState(initial ?? emptyForm);

  return (
    <div className="rounded-xl border border-[#E8DDD0] bg-[#FFF8F0] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#3D3429]">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
            Food name
          </span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full min-h-[44px] rounded-xl border border-[#E8DDD0] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
            Amount
          </span>
          <input
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full min-h-[44px] rounded-xl border border-[#E8DDD0] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
            Unit
          </span>
          <input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="g, pack, bag…"
            className="w-full min-h-[44px] rounded-xl border border-[#E8DDD0] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
            Category
          </span>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as ShoppingCategory,
              })
            }
            className="w-full min-h-[44px] rounded-xl border border-[#E8DDD0] bg-white px-3 py-2 text-sm"
          >
            {SHOPPING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-[44px] items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => setForm({ ...form, required: e.target.checked })}
            className="h-5 w-5 accent-[#E8927C]"
          />
          <span className="text-sm text-[#6B5E52]">Required item</span>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => form.name.trim() && onSave(form)}
          className="min-h-[44px] rounded-xl bg-[#E8927C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D97F68]"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-xl border border-[#E8DDD0] px-4 py-2.5 text-sm text-[#6B5E52] hover:bg-[#F4E8DC]/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
