"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  decodeBarcodeFromPhoto,
  decodeBarcodeFromVideoFrame,
  normalizeBarcode,
} from "@/lib/barcodeCapture";
import { lookupBarcodes, type BarcodeProductInfo } from "@/lib/barcodeLookup";
import {
  addOrUpdateInventoryItem,
  applyCreateSeparate,
} from "@/lib/inventoryBarcode";
import { createId } from "@/lib/id";
import { deriveIngredientTags } from "@/lib/ingredientAliases";
import { syncPantryState } from "@/lib/pantrySync";
import { searchProducts, type ProductSearchResult } from "@/lib/productSearch";
import type { InventoryCategory, ScannedInventoryItem } from "@/lib/types";
import { INVENTORY_CATEGORIES } from "@/lib/types";
import { useAppState } from "@/lib/useAppState";

interface SessionItem {
  id: string;
  barcode: string;
  prefilled: BarcodeProductInfo | null;
}

interface ReviewItem {
  id: string;
  barcode: string;
  name: string;
  amount: string;
  unit: string;
  category: InventoryCategory;
  autofill: boolean;
}

type Phase = "idle" | "collecting" | "looking-up" | "review";
type AddMode = "live" | "photo" | "search";

type FileScanner = {
  scanFileV2: (
    file: File,
    showImage?: boolean
  ) => Promise<{ decodedText: string }>;
  clear: () => void;
};

const SCAN_INTERVAL_MS = 220;
const SCAN_COOLDOWN_MS = 2500;

function emptyReviewItem(
  barcode: string,
  info?: BarcodeProductInfo | null
): ReviewItem {
  return {
    id: createId("review"),
    barcode,
    name: info?.name ?? "",
    amount: info?.amount ?? "",
    unit: info?.unit ?? "",
    category: info?.category ?? "Other",
    autofill: Boolean(info?.name),
  };
}

function productToInfo(product: ProductSearchResult): BarcodeProductInfo {
  return {
    name: product.name,
    amount: product.amount,
    unit: product.unit,
    category: product.category,
  };
}

export function BarcodeScanner() {
  const { state, updateState } = useAppState();
  const decodeRegionId = useId().replace(/:/g, "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileScannerRef = useRef<FileScanner | null>(null);
  const sessionRef = useRef<SessionItem[]>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decodingRef = useRef(false);
  const cropIndexRef = useRef(0);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const mountedRef = useRef(true);

  const [phase, setPhase] = useState<Phase>("collecting");
  const [addMode, setAddMode] = useState<AddMode>("live");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanFlash, setScanFlash] = useState(false);
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [status, setStatus] = useState<string | null>(
    "Point your camera at a barcode — it scans continuously."
  );
  const [lookupProgress, setLookupProgress] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");

  const syncSession = useCallback((items: SessionItem[]) => {
    sessionRef.current = items;
    setSessionItems(items);
  }, []);

  const triggerScanFlash = useCallback(() => {
    setScanFlash(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setScanFlash(false);
    }, 650);
  }, []);

  const addSessionItem = useCallback(
    (barcode: string, prefilled: BarcodeProductInfo | null) => {
      const code = normalizeBarcode(barcode);
      if (!code) return false;

      if (sessionRef.current.some((item) => item.barcode === code)) {
        return false;
      }

      const next = [
        ...sessionRef.current,
        { id: createId("session"), barcode: code, prefilled },
      ];
      syncSession(next);
      setStatus(`Scanned ${code} · ${next.length} items in session`);
      triggerScanFlash();
      if (navigator.vibrate) navigator.vibrate(40);
      return true;
    },
    [syncSession, triggerScanFlash]
  );

  const stopScanLoop = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopScanLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setCameraActive(false);
  }, [stopScanLoop]);

  const runScanTick = useCallback(async () => {
    if (decodingRef.current) return;

    const video = videoRef.current;
    const scanner = fileScannerRef.current;
    if (!video || !scanner || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    decodingRef.current = true;
    try {
      const raw = await decodeBarcodeFromVideoFrame(
        video,
        scanner as import("html5-qrcode").Html5Qrcode,
        cropIndexRef.current
      );
      cropIndexRef.current += 1;

      if (!raw || !mountedRef.current) return;

      const code = normalizeBarcode(raw);
      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.code === code && now - last.at < SCAN_COOLDOWN_MS) return;

      if (addSessionItem(code, null)) {
        lastScanRef.current = { code, at: now };
      }
    } finally {
      decodingRef.current = false;
    }
  }, [addSessionItem]);

  const startScanLoop = useCallback(() => {
    stopScanLoop();
    scanTimerRef.current = setInterval(() => {
      void runScanTick();
    }, SCAN_INTERVAL_MS);
  }, [runScanTick, stopScanLoop]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported in this browser.");
      return;
    }

    stopCamera();
    setCameraError(null);
    setStatus("Starting camera…");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      setCameraActive(true);
      setStatus("Scanning… hold barcode in the center box.");
      startScanLoop();
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access and try again."
          : "Could not start camera. Try photo mode or search instead.";
      setCameraError(message);
      setStatus(message);
      stopCamera();
    }
  }, [facingMode, startScanLoop, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void import("html5-qrcode").then(({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
      fileScannerRef.current = new Html5Qrcode(decodeRegionId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
    });

    return () => {
      mountedRef.current = false;
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      stopCamera();
      try {
        fileScannerRef.current?.clear();
      } catch {
        // Ignore.
      }
    };
  }, [decodeRegionId, stopCamera]);

  useEffect(() => {
    if (addMode !== "live" || phase !== "collecting") {
      stopCamera();
    }
  }, [addMode, phase, stopCamera]);

  useEffect(() => {
    if (addMode !== "live" || phase !== "collecting" || !cameraActive) return;
    void startCamera();
    // Restart stream when flipping cameras during an active session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handlePhotoSelected = async (file: File | null) => {
    if (!file || processingPhoto) return;

    setProcessingPhoto(true);
    setStatus("Reading barcode (native + html5-qrcode + ZXing)…");

    try {
      const scanner = fileScannerRef.current;
      if (!scanner) throw new Error("Scanner not ready");

      const raw = await decodeBarcodeFromPhoto(file, scanner as import("html5-qrcode").Html5Qrcode);
      if (!mountedRef.current) return;

      if (raw) {
        addSessionItem(raw, null);
      } else {
        setStatus(
          "Couldn't read that photo. Try live scan, better lighting, or search by name."
        );
      }
    } catch {
      if (mountedRef.current) {
        setStatus("Photo failed — try live scan or search by name.");
      }
    } finally {
      setProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchProducts(query);
      if (mountedRef.current) {
        setSearchResults(results);
        setSearching(false);
      }
    }, 350);
  };

  const addFromSearch = (product: ProductSearchResult) => {
    addSessionItem(product.barcode, productToInfo(product));
    setSearchQuery("");
    setSearchResults([]);
  };

  const addManualBarcode = () => {
    const code = normalizeBarcode(manualBarcode);
    if (!code) {
      setStatus("Enter a valid barcode number.");
      return;
    }
    if (addSessionItem(code, null)) {
      setManualBarcode("");
    } else {
      setStatus(`Already added ${code}. Scan or enter the next item.`);
    }
  };

  const removeSessionItem = (id: string) => {
    syncSession(sessionRef.current.filter((item) => item.id !== id));
  };

  const finishCollecting = async () => {
    const items = sessionRef.current;
    if (items.length === 0) {
      setStatus("Add at least one item by scanning, photo, or search.");
      return;
    }

    stopCamera();

    const needsLookup = items.filter((item) => !item.prefilled);

    if (needsLookup.length === 0) {
      setReviewItems(
        items.map((item) => emptyReviewItem(item.barcode, item.prefilled))
      );
      setPhase("review");
      return;
    }

    setPhase("looking-up");
    setLookupProgress(`Looking up 0 / ${needsLookup.length}…`);

    const lookupMap = await lookupBarcodes(
      needsLookup.map((item) => item.barcode),
      (done, total) => {
        if (mountedRef.current) setLookupProgress(`Looking up ${done} / ${total}…`);
      }
    );

    if (!mountedRef.current) return;

    setReviewItems(
      items.map((item) =>
        emptyReviewItem(item.barcode, item.prefilled ?? lookupMap.get(item.barcode) ?? null)
      )
    );
    setLookupProgress(null);
    setPhase("review");
  };

  const updateReviewItem = (id: string, patch: Partial<ReviewItem>) => {
    setReviewItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const addAllToInventory = () => {
    const valid = reviewItems.filter((item) => item.name.trim());
    if (valid.length === 0 || !state) return;

    updateState((prev) => {
      let nextInventory = prev.inventory;

      for (const item of valid) {
        const scanned: ScannedInventoryItem = {
          name: item.name.trim(),
          amount: item.amount.trim(),
          unit: item.unit.trim(),
          category: item.category,
          percentLeft: 100,
          ingredientTags: deriveIngredientTags(item.name.trim(), item.category),
        };

        const result = addOrUpdateInventoryItem(nextInventory, scanned);
        if (result.type === "added") {
          nextInventory = result.inventory;
        } else {
          nextInventory = applyCreateSeparate(nextInventory, scanned);
        }
      }

      return syncPantryState({ ...prev, inventory: nextInventory });
    });

    triggerScanFlash();
    syncSession([]);
    setReviewItems([]);
    setPhase("collecting");
    setStatus("Added to kitchen inventory. Keep scanning to add more.");
  };

  const discardReview = () => {
    setReviewItems([]);
    setPhase("collecting");
    setStatus("Point your camera at a barcode — it scans continuously.");
  };

  const removeFromInventory = (id: string) => {
    updateState((prev) =>
      syncPantryState({
        ...prev,
        inventory: prev.inventory.filter((item) => item.id !== id),
      })
    );
  };

  const inventory = state?.inventory ?? [];

  const handleModeChange = (mode: AddMode) => {
    if (mode !== "live") stopCamera();
    setAddMode(mode);
    if (mode === "live") {
      setStatus("Tap Start scanning, then point at each barcode.");
    } else if (mode === "photo") {
      setStatus("Snap a photo if live scan struggles on curved cans.");
    } else {
      setStatus("Search by product name if scanning fails.");
    }
  };

  return (
    <div className="space-y-6">
      {scanFlash && (
        <div
          className="scan-success-outline pointer-events-none fixed inset-0 z-[100]"
          aria-hidden
        />
      )}

      <div id={decodeRegionId} className="hidden" aria-hidden />

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4">
        <div className="mb-4">
          <p className="text-sm font-medium text-[var(--text)]">Add groceries</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Live scan runs native + html5-qrcode + ZXing continuously. Use photo
            or search as backup.
          </p>
        </div>

        {phase === "collecting" && (
          <>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleModeChange("live")}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  addMode === "live"
                    ? "bg-[var(--salmon)] text-white"
                    : "border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-muted)]"
                }`}
              >
                Live scan
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("photo")}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  addMode === "photo"
                    ? "bg-[var(--salmon)] text-white"
                    : "border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-muted)]"
                }`}
              >
                Snap photo
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("search")}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  addMode === "search"
                    ? "bg-[var(--salmon)] text-white"
                    : "border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-muted)]"
                }`}
              >
                Search
              </button>
            </div>

            {addMode === "live" && (
              <div className="space-y-3">
                <div className="barcode-scanner-region relative overflow-hidden rounded-xl bg-black">
                  <video ref={videoRef} muted playsInline className="min-h-[220px] w-full" />
                  {cameraActive && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-24 w-[85%] rounded-lg border-2 border-[var(--salmon)]/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={() => void startCamera()}
                      className="flex-1 rounded-xl bg-[var(--salmon)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--salmon-dark)]"
                    >
                      Start scanning
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={switchCamera}
                        className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--background)]/50"
                      >
                        Flip camera
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--background)]/50"
                      >
                        Stop
                      </button>
                    </>
                  )}
                </div>

                {cameraActive && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Scanning ~4×/sec with all three decoders. Move slowly across
                    the barcode — each item auto-adds to your session.
                  </p>
                )}
                {cameraError && (
                  <p className="text-xs text-[#B85C5C]">{cameraError}</p>
                )}
              </div>
            )}

            {addMode === "photo" && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => void handlePhotoSelected(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processingPhoto}
                  className="w-full rounded-xl bg-[var(--salmon)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--salmon-dark)]"
                >
                  {processingPhoto ? "Reading photo…" : "Snap barcode photo"}
                </button>
              </div>
            )}

            {addMode === "search" && (
              <div className="space-y-3">
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder='Search e.g. "Monster Ultra" or "Greek yogurt"'
                  className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--salmon)]"
                />
                {searching && (
                  <p className="text-xs text-[var(--text-muted)]">Searching products…</p>
                )}
                {searchResults.length > 0 && (
                  <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {searchResults.map((product) => (
                      <li key={product.barcode}>
                        <button
                          type="button"
                          onClick={() => addFromSearch(product)}
                          className="flex w-full items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-3 text-left hover:bg-[var(--background)]"
                        >
                          {product.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-lg object-contain"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text)]">
                              {product.name}
                            </p>
                            <p className="font-mono text-xs text-[var(--text-muted)]">
                              {product.barcode}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--surface)] p-3">
              <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">
                Manual barcode entry
              </p>
              <div className="flex gap-2">
                <input
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addManualBarcode();
                  }}
                  placeholder="Type barcode number"
                  inputMode="numeric"
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={addManualBarcode}
                  className="btn-secondary shrink-0 px-4"
                >
                  Add
                </button>
              </div>
            </div>

            {status && (
              <p className="mt-4 rounded-xl bg-[var(--background)]/60 px-4 py-3 text-sm text-[var(--text-muted)]">
                {status}
              </p>
            )}

            {sessionItems.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">
                  Session ({sessionItems.length} items)
                </p>
                <ul className="space-y-2">
                  {sessionItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-[var(--text)]">
                          {item.prefilled?.name ?? `Barcode ${item.barcode}`}
                        </p>
                        <p className="font-mono text-xs text-[var(--text-muted)]">{item.barcode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSessionItem(item.id)}
                        className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => void finishCollecting()}
              disabled={sessionItems.length === 0}
              className="mt-4 w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-muted)] disabled:opacity-50 hover:bg-[var(--background)]/50"
            >
              Review & add ({sessionItems.length})
            </button>
          </>
        )}

        {phase === "looking-up" && (
          <p className="rounded-xl bg-[var(--background)]/60 px-4 py-3 text-center text-sm text-[var(--text-muted)]">
            {lookupProgress ?? "Fetching product details…"}
          </p>
        )}
      </div>

      {phase === "review" && reviewItems.length > 0 && (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text)]">Review items</h3>
            <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-medium text-[#8B6F5C]">
              {reviewItems.length} items
            </span>
          </div>

          <ul className="space-y-4">
            {reviewItems.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--text-muted)]">{item.barcode}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      item.autofill
                        ? "bg-[#E8F5E9]/80 text-[#5C7A5C]"
                        : "bg-[#F5D9A8]/50 text-[#8B6F5C]"
                    }`}
                  >
                    {item.autofill ? "Auto-filled" : "Needs name"}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Name</span>
                    <input
                      value={item.name}
                      onChange={(e) => updateReviewItem(item.id, { name: e.target.value })}
                      className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Amount</span>
                    <input
                      value={item.amount}
                      onChange={(e) => updateReviewItem(item.id, { amount: e.target.value })}
                      className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Unit</span>
                    <input
                      value={item.unit}
                      onChange={(e) => updateReviewItem(item.id, { unit: e.target.value })}
                      className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Category</span>
                    <select
                      value={item.category}
                      onChange={(e) =>
                        updateReviewItem(item.id, {
                          category: e.target.value as InventoryCategory,
                        })
                      }
                      className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    >
                      {INVENTORY_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addAllToInventory}
              disabled={!reviewItems.some((i) => i.name.trim())}
              className="rounded-xl bg-[var(--salmon)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[var(--salmon-dark)]"
            >
              Add all to inventory
            </button>
            <button
              type="button"
              onClick={discardReview}
              className="rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--background)]/50"
            >
              Back
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Kitchen inventory</h3>
            <p className="text-xs text-[var(--text-muted)]">Synced with Dashboard and Shopping List</p>
          </div>
          <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-medium text-[#8B6F5C]">
            {inventory.length} {inventory.length === 1 ? "item" : "items"}
          </span>
        </div>

        {inventory.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Live scan items into a session, review them, then add to your kitchen
            inventory.
          </p>
        ) : (
          <ul className="space-y-2">
            {inventory.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text)]">{item.name}</p>
                  {(item.amount || item.unit) && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {[item.amount, item.unit].filter(Boolean).join(" ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {item.category} · {item.percentLeft}% left
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromInventory(item.id)}
                  className="shrink-0 rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
