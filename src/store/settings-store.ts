"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppSettings } from "@/types/settings";
import type { CsvDefaults } from "@/types/csv";
import { DEFAULT_CSV_DEFAULTS } from "@/lib/constants/shopify";
import { SETTINGS_STORAGE_KEY } from "@/lib/constants/app";

export const DEFAULT_SETTINGS: AppSettings = {
  nameSeparator: "",
  startNumber: 1,
  zipFolderPerProduct: false,
  csv: DEFAULT_CSV_DEFAULTS,
};

type SettingsState = AppSettings & {
  update: (patch: Partial<Omit<AppSettings, "csv">>) => void;
  updateCsv: (patch: Partial<CsvDefaults>) => void;
  reset: () => void;
};

/**
 * Only lightweight preferences are persisted to localStorage.
 * File objects never go in here.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      updateCsv: (patch) => set((s) => ({ csv: { ...s.csv, ...patch } })),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => window.localStorage),
      // Rehydrated manually in AppShell to avoid SSR hydration mismatches.
      skipHydration: true,
      partialize: ({ nameSeparator, startNumber, zipFolderPerProduct, csv }) => ({
        nameSeparator,
        startNumber,
        zipFolderPerProduct,
        csv,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppSettings>;
        return { ...current, ...p, csv: { ...current.csv, ...(p.csv ?? {}) } };
      },
    },
  ),
);
