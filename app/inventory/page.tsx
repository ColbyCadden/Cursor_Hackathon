"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { InventoryManager } from "@/components/InventoryManager";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { useAppState } from "@/lib/useAppState";

function InventoryContent() {
  const { state, updateState } = useAppState();
  if (!state) return null;

  const { inventory, profile } = state;
  const lowStock = inventory.filter((item) => item.portionsLeft <= 2).length;

  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-3xl">
        <PageHeader
          title="Pantry"
          subtitle="Track what's in your fridge and pantry. The AI meal planner uses this list too."
        />

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--text-muted)]">Total items</p>
            <p className="mt-1 text-2xl font-bold text-[var(--text)]">{inventory.length}</p>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--text-muted)]">Running low (≤2 portions)</p>
            <p className="mt-1 text-2xl font-bold text-[var(--text)]">{lowStock}</p>
          </div>
        </div>

        <SectionCard
          title="Your pantry"
          description="Add items manually or scan barcodes on the Scanner page."
          badge={`${inventory.length} items`}
        >
          <InventoryManager
            inventory={inventory}
            onChange={(nextInventory) =>
              updateState((prev) => ({ ...prev, inventory: nextInventory }))
            }
          />

          {inventory.length === 0 && (
            <div className="mt-4 border-t border-[var(--card-border)] pt-4">
              <Link href="/scanner" className="btn-secondary inline-flex">
                Open barcode scanner
              </Link>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

export default function InventoryPage() {
  return (
    <AuthGuard>
      <InventoryContent />
    </AuthGuard>
  );
}
