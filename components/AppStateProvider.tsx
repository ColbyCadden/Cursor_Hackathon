"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { getAppState, saveAppState, STORAGE_KEY } from "@/lib/storage";
import type { AppState } from "@/lib/types";

type AppStateContextValue = {
  state: AppState | null;
  hydrated: boolean;
  setState: Dispatch<SetStateAction<AppState | null>>;
  updateState: (updater: (prev: AppState) => AppState) => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  /** Skip storage refresh for saves we just made — avoids duplicate state merges. */
  const suppressStorageRefreshRef = useRef(false);
  const skipNextPersistRef = useRef(true);

  useEffect(() => {
    setState(getAppState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!state || !hydrated) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    suppressStorageRefreshRef.current = true;
    saveAppState(state);
    suppressStorageRefreshRef.current = false;
  }, [state, hydrated]);

  useEffect(() => {
    const refreshFromStorage = () => {
      if (suppressStorageRefreshRef.current) return;
      skipNextPersistRef.current = true;
      setState(getAppState());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) refreshFromStorage();
    };

    window.addEventListener("prepdeck-state-changed", refreshFromStorage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("prepdeck-state-changed", refreshFromStorage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
  }, []);

  return (
    <AppStateContext.Provider value={{ state, hydrated, setState, updateState }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
