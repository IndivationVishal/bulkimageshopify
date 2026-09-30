import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import { generateShopifyCsv, productsToRows, toBodyHtml } from "./csv-generator";
import { validateProducts, hasErrors } from "./csv-validator";
import { SHOPIFY_CSV_COLUMNS } from "./csv-columns";
import { createProduct, mapCdnImagesToProducts } from "@/lib/products/product-mapper";
import { parseCdnUrls } from "./cdn-parser";
import { DEFAULT_CSV_DEFAULTS as D } from "@/lib/constants/shopify";

const urls = [1, 2, 3].map((n) => `https://store.com/cdn/shop/files/red-ring${n}_abcdef1234.webp?v=1`).join("\n");

describe("csv generator", () => {
  const { images } = parseCdnUrls(urls);
  const { products, created } = mapCdnImagesToProducts([], images, D, { createMissing: true });

  it("creates a product from URLs", () => {
    expect(created).toBe(1);
    expect(products[0].title).toBe("Red Ring");
    expect(products[0].images.map((i) => i.position)).toEqual([1, 2, 3]);
  });

  it("puts product data on row 1 and only images on rows 2..n", () => {
    const rows = productsToRows(products, D);
    expect(rows).toHaveLength(3);
    expect(rows[0].Title).toBe("Red Ring");
    expect(rows[0]["Variant Inventory Qty"]).toBe("10");
    expect(rows[0]["Image Position"]).toBe("1");
    expect(rows[1].Title).toBe("");
    expect(rows[1].Handle).toBe("red-ring");
    expect(rows[2]["Image Src"]).toContain("red-ring3");
    expect(rows[2]["Image Position"]).toBe("3");
  });

  it("produces CSV with Shopify headers", () => {
    const csv = generateShopifyCsv(products, D);
    const parsed = Papa.parse<string[]>(csv);
    expect(parsed.data[0]).toEqual([...SHOPIFY_CSV_COLUMNS]);
    expect(parsed.data).toHaveLength(4);
  });

  it("maps URLs onto existing products by handle and position", () => {
    const existing = createProduct(
      {
        title: "Red Ring",
        handle: "red-ring",
        images: [1, 2].map((n) => ({ id: `i${n}`, originalName: "", extension: "webp", fileName: `red-ring${n}.webp`, position: n })),
      },
      D,
    );
    const r = mapCdnImagesToProducts([existing], images, D, { createMissing: false });
    expect(r.created).toBe(0);
    expect(r.products[0].images).toHaveLength(3);
    expect(r.products[0].images.every((i) => i.src)).toBe(true);
  });

  it("converts plain descriptions to HTML", () => {
    expect(toBodyHtml("Line <1>\nLine 2\n\nPara")).toBe("<p>Line &lt;1&gt;<br>Line 2</p><p>Para</p>");
    expect(toBodyHtml("<b>Hi</b>")).toBe("<b>Hi</b>");
  });

  it("validates", () => {
    expect(hasErrors(validateProducts(products, "0.00"))).toBe(false);
    const bad = [{ ...products[0], handle: "Bad Handle", price: "abc" }, { ...products[0] }];
    const issues = validateProducts(bad, "0.00");
    expect(issues.filter((i) => i.severity === "error").length).toBeGreaterThanOrEqual(2);
  });
});

import { extractCdnBase } from "./cdn-parser";
import { applyCdnBase } from "@/lib/products/product-mapper";

describe("one-link base", () => {
  it("extracts the shared folder from a single link", () => {
    expect(
      extractCdnBase("https://cdn.shopify.com/s/files/1/0842/3099/6221/files/test-pro3.png?v=1790770489"),
    ).toBe("https://cdn.shopify.com/s/files/1/0842/3099/6221/files/");
    expect(extractCdnBase("https://store.com/cdn/shop/files/")).toBe("https://store.com/cdn/shop/files/");
    expect(extractCdnBase("nope")).toBeNull();
    expect(extractCdnBase("ftp://a.com/x.png")).toBeNull();
    expect(extractCdnBase("https://a.com/x.png")).toBe("https://a.com/");
  });

  it("builds a link for every image from file names", () => {
    const img = (n: number, src?: string) => ({
      id: `i${n}`, originalName: "", extension: "png", fileName: `test-pro${n}.png`, position: n, src,
    });
    const p = createProduct({ title: "Test Pro", handle: "test-pro", images: [img(1), img(2, "https://old/x.png"), img(3)] }, D);
    const base = "https://cdn.shopify.com/s/files/1/0842/3099/6221/files/";

    const r = applyCdnBase([p], base);
    expect(r.applied).toBe(2);
    expect(r.kept).toBe(1);
    expect(r.products[0].images.map((i) => i.src)).toEqual([
      `${base}test-pro1.png`, "https://old/x.png", `${base}test-pro3.png`,
    ]);

    const all = applyCdnBase([p], base, { overwrite: true });
    expect(all.applied).toBe(3);
    const csv = generateShopifyCsv(all.products, D);
    expect(csv).toContain(`${base}test-pro2.png`);
  });
});
