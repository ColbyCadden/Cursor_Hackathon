"use client";

import { useMemo, useState } from "react";
import { InventoryItemCard } from "./InventoryItemCard";
import { createId } from "@/lib/id";
import {
  INVENTORY_CATEGORIES,
  type InventoryCategory,
  type InventoryItem,
} from "@/lib/types";

const emptyForm = {
  name: "",
  amount: "",
  unit: "",
  category: "Protein" as InventoryCategory,
  percentLeft: 100,
};

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onChange: (inventory: InventoryItem[]) => void;
}

export function InventoryManager({ inventory, onChange }: InventoryManagerProps) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [inventory, search]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      category: item.category,
      percentLeft: item.percentLeft,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;

    if (editingId) {
      onChange(
        inventory.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: form.name.trim(),
                amount: form.amount,
                unit: form.unit,
                category: form.category,
                percentLeft: form.percentLeft,
              }
            : item
        )
      );
    } else {
      onChange([
        ...inventory,
        {
          id: createId("inv"),
          name: form.name.trim(),
          amount: form.amount,
          unit: form.unit,
          category: form.category,
          percentLeft: form.percentLeft,
        },
      ]);
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    onChange(inventory.filter((item) => item.id !== id));
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inventory…"
          className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--salmon)] sm:max-w-xs"
        />
        <button
          type="button"
          onClick={openAdd}
          className="btn-primary"
        >
          + Add item
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-[#E8DDD0] bg-[#FFF8F0] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#3D3429]">
            {editingId ? "Edit item" : "Add item"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
                Food name
              </span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-[#E8DDD0] bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
                Amount
              </span>
              <input
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-xl border border-[#E8DDD0] bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
                Unit
              </span>
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="g, cups, bag…"
                className="w-full rounded-xl border border-[#E8DDD0] bg-white px-3 py-2 text-sm"
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
                    category: e.target.value as InventoryCategory,
                  })
                }
                className="w-full rounded-xl border border-[#E8DDD0] bg-white px-3 py-2 text-sm"
              >
                {INVENTORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
                Percent left: {form.percentLeft}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={form.percentLeft}
                onChange={(e) =>
                  setForm({ ...form, percentLeft: Number(e.target.value) })
                }
                className="w-full accent-[#E8927C]"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[#E8927C] px-4 py-2 text-sm font-semibold text-white"
            >
              Save
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-[#E8DDD0] px-4 py-2 text-sm text-[#6B5E52]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state py-8">
          <p className="empty-state-icon" aria-hidden>
            🧊
          </p>
          <p className="empty-state-title">
            {search ? "No matches" : "No inventory yet"}
          </p>
          <p className="empty-state-text">
            {search
              ? "Try a different search term."
              : "Add items manually or use demo barcode scans below."}
          </p>
          {!search && (
            <button type="button" onClick={openAdd} className="btn-primary mt-4">
              + Add first item
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
