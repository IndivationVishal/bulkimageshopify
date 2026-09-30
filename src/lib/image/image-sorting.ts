import type { SortMode } from "@/types/image";
import { naturalCompare } from "@/lib/utils/file-utils";

/**
 * Return a new array ordered by the chosen mode.
 * "selection" keeps the current (user-arranged) order.
 */
export function sortByMode<T>(items: T[], mode: SortMode, getName: (item: T) => string): T[] {
  if (mode === "selection") return [...items];
  const sorted = [...items].sort((a, b) => naturalCompare(getName(a), getName(b)));
  return mode === "nameDesc" ? sorted.reverse() : sorted;
}

/** Move one item from `from` to `to` (immutable). */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
