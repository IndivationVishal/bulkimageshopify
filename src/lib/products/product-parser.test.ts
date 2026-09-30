import { describe, expect, it } from "vitest";
import { parseProductFolders } from "./product-parser";
import { generateHandle, uniqueHandle } from "./handle-generator";
import { DEFAULT_CSV_DEFAULTS as D } from "@/lib/constants/shopify";

const f = (name: string, type = "image/jpeg") => new File(["x"], name, { type });

describe("handles", () => {
  it("slugifies titles", () => {
    expect(generateHandle("Red Ring (Gold) 18K")).toBe("red-ring-gold-18k");
    expect(generateHandle("Café & Crème")).toBe("cafe-and-creme");
    expect(generateHandle("✨")).toBe("product");
  });
  it("dedupes", () => {
    const taken = new Set(["a"]);
    expect(uniqueHandle("a", taken)).toBe("a-2");
    expect(uniqueHandle("a", taken)).toBe("a-3");
  });
});

describe("folder parser", () => {
  it("groups files by folder and renames them", () => {
    const { products, rejected } = parseProductFolders(
      [
        { file: f("img10.jpg"), path: "Products/Red Ring/img10.jpg" },
        { file: f("img2.jpg"), path: "Products/Red Ring/img2.jpg" },
        { file: f("a.webp", "image/webp"), path: "Products/Blue Ring/a.webp" },
        { file: f("notes.txt", "text/plain"), path: "Products/Blue Ring/notes.txt" },
        { file: f(".DS_Store", ""), path: "Products/.DS_Store" },
      ],
      D,
      { separator: "", startNumber: 1, existingHandles: ["blue-ring"] },
    );
    expect(products.map((p) => [p.title, p.handle])).toEqual([
      ["Blue Ring", "blue-ring-2"],
      ["Red Ring", "red-ring"],
    ]);
    expect(products[1].images.map((i) => [i.originalName, i.fileName])).toEqual([
      ["img2.jpg", "red-ring1.jpg"],
      ["img10.jpg", "red-ring2.jpg"],
    ]);
    expect(rejected).toEqual([{ name: "notes.txt", reason: "Not an image" }]);
  });
});

import { importRenamedImages } from "./product-parser";
import { createProduct } from "./product-mapper";

describe("already-renamed import", () => {
  const pf = (name: string) => ({ file: f(name, "image/png"), path: name });

  it("groups by file name without renaming", () => {
    const r = importRenamedImages(
      [pf("red-ring2.png"), pf("red-ring1.png"), pf("blue-ring1.png"), pf("cover.png")],
      [],
      D,
      "",
    );
    expect(r.products.map((p) => [p.handle, p.title, p.images.map((i) => i.fileName)])).toEqual([
      ["blue-ring", "Blue Ring", ["blue-ring1.png"]],
      ["red-ring", "Red Ring", ["red-ring1.png", "red-ring2.png"]],
    ]);
    expect(r.created).toBe(2);
    expect(r.rejected.map((x) => x.name)).toEqual(["cover.png"]);
  });

  it("re-attaches files to restored products and keeps their edits", () => {
    const restored = createProduct(
      {
        title: "Red Ring Gold",
        handle: "red-ring",
        price: "499",
        images: [1, 2].map((n) => ({
          id: `i${n}`, originalName: "", extension: "png", fileName: `red-ring${n}.png`, position: n,
          src: `https://cdn/x/red-ring${n}.png`,
        })),
      },
      D,
    );
    const r = importRenamedImages([pf("red-ring1.png"), pf("red-ring2.png"), pf("red-ring3.png")], [restored], D, "");
    expect(r.created).toBe(0);
    expect(r.attached).toBe(2);
    expect(r.added).toBe(1);
    const p = r.products[0];
    expect(p.title).toBe("Red Ring Gold");
    expect(p.price).toBe("499");
    expect(p.images.map((i) => [i.position, !!i.file, i.src ?? null])).toEqual([
      [1, true, "https://cdn/x/red-ring1.png"],
      [2, true, "https://cdn/x/red-ring2.png"],
      [3, true, null],
    ]);
  });

  it("handles digit-ending handles", () => {
    const r = importRenamedImages([pf("red-ring-2-1.png")], [], D, "");
    expect(r.products[0].handle).toBe("red-ring-2");
    expect(r.products[0].images[0].position).toBe(1);
  });
});
