"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hexagon } from "lucide-react";
import { APP_NAME, NAV_SECTIONS, SETTINGS_NAV, type NavItem } from "@/lib/constants/app";
import { cn } from "@/lib/utils/cn";
import { NavIcon } from "./NavIcon";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      <NavIcon name={item.icon} className="size-4" />
      {item.label}
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-5 py-5">
        <Hexagon className="size-6 fill-accent-soft text-accent" aria-hidden />
        <span className="text-sm leading-tight font-semibold">
          {APP_NAME.split(" ").slice(0, 2).join(" ")}
          <span className="block text-xs font-normal text-muted">{APP_NAME.split(" ").slice(2).join(" ")}</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3" aria-label="Main">
        {NAV_SECTIONS.map((section, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {section.title && (
              <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wider text-subtle uppercase">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink item={SETTINGS_NAV} onNavigate={onNavigate} />
        <p className="px-2.5 pt-2 text-[11px] text-subtle">Files never leave your browser.</p>
      </div>
    </div>
  );
}
