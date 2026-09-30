"use client";

import { Hexagon, Menu } from "lucide-react";
import { APP_NAME } from "@/lib/constants/app";

/** Top bar shown on small screens only. */
export function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-1.5 text-muted hover:bg-surface-2"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>
      <Hexagon className="size-5 fill-accent-soft text-accent" aria-hidden />
      <span className="text-sm font-semibold">{APP_NAME}</span>
    </header>
  );
}
