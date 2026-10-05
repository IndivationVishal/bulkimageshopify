import { describe, expect, it } from "vitest";
import {
  buildUpdatedExportCsv,
  imageNamesFromPaths,
  matchImagesToProducts,
  parseShopifyExport,
} from "./existing-products";

const EXPORT = [
  "Handle,Title,Body (HTML),Option1 Value,Image Src",
  'pink,Pink Kurti,"<p>Soft, cotton</p>",S,',
  "pink,,,M,",
  "red-ring-1,Red Ring (Gold),<p>x</p>,Default Title,https://cdn.shopify.com/old.jpg",
  "blue,Blue,,Default Title,",
].join("\n");

describe("existing products", () => {
  it("reads one product per handle from a Shopify export", () => {
    const r = parseShopifyExport("﻿" + EXPORT);
    expect(r.error).toBeNull();
    expect(r.products).toEqual([
      { handle: "pink", title: "Pink Kurti", existingImages: 0 },
      { handle: "red-ring-1", title: "Red Ring (Gold)", existingImages: 1 },
      { handle: "blue", title: "Blue", existingImages: 0 },
    ]);
    expect(parseShopifyExport("Title\nX").error).toMatch(/Handle/);
  });

  it("matches files by handle, then by title", () => {
    const { products } = parseShopifyExport(EXPORT);
    const r = matchImagesToProducts(products, [
      "pink2.jpg",
      "pink10.jpg",
      "pink1.jpg",
      "red-ring-gold1.webp",
      "pink1.png",
      "green1.jpg",
      "cover.jpg",
    ]);
    expect(r.products.map((p) => [p.handle, p.images.map((i) => i.fileName)])).toEqual([
      ["pink", ["pink1.jpg", "pink2.jpg", "pink10.jpg"]],
      ["red-ring-1", ["red-ring-gold1.webp"]],
      ["blue", []],
    ]);
    expect(r.products[1].images[0].matchedBy).toBe("title");
    expect(r.unmatched.map((u) => u.fileName)).toEqual(["cover.jpg", "green1.jpg", "pink1.png"]);
  });

  it("writes the export back with images filled in", () => {
    const csv = [
      "Handle,Title,Option1 Name,Option1 Value,Variant Price,Image Src,Image Position,Image Alt Text",
      "pink,Pink Kurti,Size,S,499,,,",
      "pink,,,M,499,,,",
      "blue,Blue,Title,Default Title,99,https://cdn/old.jpg,1,Old",
      "blue,,,,,https://cdn/old2.jpg,2,",
      "green,Green,Title,Default Title,10,,,",
    ].join("\n");
    const parsed = parseShopifyExport(csv);
    const { products } = matchImagesToProducts(parsed.products, ["pink1.jpg", "pink2.jpg", "pink3.jpg", "blue1.png"]);
    const base = "https://cdn.shopify.com/f/";

    expect(buildUpdatedExportCsv(parsed.table, products, base).split("\r\n")).toEqual([
      "Handle,Title,Option1 Name,Option1 Value,Variant Price,Image Src,Image Position,Image Alt Text",
      "pink,Pink Kurti,Size,S,499,https://cdn.shopify.com/f/pink1.jpg,1,Pink Kurti",
      "pink,,,M,499,https://cdn.shopify.com/f/pink2.jpg,2,Pink Kurti",
      "pink,,,,,https://cdn.shopify.com/f/pink3.jpg,3,Pink Kurti",
      "blue,Blue,Title,Default Title,99,https://cdn/old.jpg,1,Old",
      "blue,,,,,https://cdn/old2.jpg,2,",
      "blue,,,,,https://cdn.shopify.com/f/blue1.png,3,Blue",
    ]);

    const replaced = buildUpdatedExportCsv(parsed.table, products, base, { replaceExisting: true }).split("\r\n");
    expect(replaced.filter((l) => l.startsWith("blue"))).toEqual([
      "blue,Blue,Title,Default Title,99,https://cdn.shopify.com/f/blue1.png,1,Blue",
    ]);
  });

  it("adds image columns when the export has none", () => {
    const parsed = parseShopifyExport("Handle,Title\npink,Pink");
    const { products } = matchImagesToProducts(parsed.products, ["pink1.jpg"]);
    expect(buildUpdatedExportCsv(parsed.table, products, "https://c/").split("\r\n")).toEqual([
      "Handle,Title,Image Src,Image Position,Image Alt Text",
      "pink,Pink,https://c/pink1.jpg,1,Pink",
    ]);
  });

  it("keeps only image names from zip paths", () => {
    expect(
      imageNamesFromPaths(["pink/", "pink/pink1.jpg", "__MACOSX/pink/._pink1.jpg", "pink/.DS_Store", "notes.txt"]),
    ).toEqual(["pink1.jpg"]);
  });
});
