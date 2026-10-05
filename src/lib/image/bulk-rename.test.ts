import { describe, expect, it } from "vitest";
import type { RenameFile } from "@/types/image";
import { bulkZipEntries, planProducts } from "./bulk-rename";
import { groupByFolder } from "@/hooks/useImageFiles";

const rf = (id: string, name: string): RenameFile => {
  const file = new File(["x"], name, { type: "image/jpeg" });
  return { id, file, originalName: name, extension: name.split(".").pop()!, size: 1 };
};

const product = (id: string, handle: string, files: RenameFile[]) => ({
  id,
  handle,
  files,
  startNumber: 1,
  sortMode: "nameAsc" as const,
});

describe("bulk rename", () => {
  it("puts each product in its own folder", () => {
    const plans = planProducts([
      product("a", "red-ring", [rf("1", "b.jpg"), rf("2", "a.jpg")]),
      product("b", "blue-ring", [rf("3", "x.png")]),
    ]);
    expect(plans.every((p) => p.error === null)).toBe(true);
    expect(bulkZipEntries(plans).map((e) => [e.path, (e.file as File).name])).toEqual([
      ["red-ring/red-ring1.jpg", "a.jpg"],
      ["red-ring/red-ring2.jpg", "b.jpg"],
      ["blue-ring/blue-ring1.png", "x.png"],
    ]);
  });

  it("flags duplicate and missing handles, ignores empty products", () => {
    const plans = planProducts([
      product("a", "ring", [rf("1", "a.jpg")]),
      product("b", "ring-", [rf("2", "b.jpg")]),
      product("c", "", [rf("3", "c.jpg")]),
      product("d", "ring", []),
    ]);
    expect(plans.map((p) => p.error)).toEqual([
      "Another product already uses this handle",
      "Another product already uses this handle",
      "Enter a product name or handle",
      null,
    ]);
  });

  it("groups dropped files by folder", () => {
    const f = (name: string) => new File(["x"], name);
    expect(groupByFolder([{ file: f("a.jpg"), path: "Shoot/a.jpg" }])).toBeNull();
    const groups = groupByFolder([
      { file: f("2.jpg"), path: "Shoot/Red Ring/2.jpg" },
      { file: f("10.jpg"), path: "Shoot/Red Ring/10.jpg" },
      { file: f("1.jpg"), path: "Shoot/Blue Ring/1.jpg" },
    ]);
    expect(groups?.map((g) => [g.name, g.files.map((x) => x.name)])).toEqual([
      ["Blue Ring", ["1.jpg"]],
      ["Red Ring", ["2.jpg", "10.jpg"]],
    ]);
  });
});
