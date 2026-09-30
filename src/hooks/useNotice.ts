"use client";

import { useCallback, useState } from "react";

export type Notice = { tone: "info" | "success" | "warning" | "danger"; title: string; body?: string };

/** One dismissible message per screen. */
export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const clear = useCallback(() => setNotice(null), []);
  return { notice, setNotice, clear };
}
