"use client";

import { useCallback, useEffect, useState } from "react";
import { getAppState, saveAppState } from "./storage";
import type { AppState } from "./types";

export function useAppState() {
  const [state, setState] = useState<AppState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(getAppState());
    setHydrated(true);
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveAppState(next);
      return next;
    });
  }, []);

  return { state, hydrated, setState, updateState };
}
