"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { useAppState } from "@/lib/useAppState";

function ScannerContent() {
  const { state } = useAppState();

  if (!state) return null;

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-3xl">
        <PageHeader
          title="Barcode Scanner"
          subtitle="Scan groceries to add them to your kitchen inventory."
        />

        <SectionCard
          title="Scan and add items"
          description="Live camera scanning with photo snap and product search fallbacks."
        >
          <BarcodeScanner />
        </SectionCard>
      </div>
    </AppShell>
  );
}

export default function ScannerPage() {
  return (
    <AuthGuard>
      <ScannerContent />
    </AuthGuard>
  );
}
