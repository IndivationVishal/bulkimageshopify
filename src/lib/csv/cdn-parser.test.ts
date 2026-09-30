import { describe, expect, it } from "vitest";
import { parseCdnUrls, splitHandleAndNumber } from "./cdn-parser";

describe("cdn parser", () => {
  it("parses Shopify file URLs with uuid suffix and query", () => {
    const { images, errors } = parseCdnUrls(`
      https://store.com/cdn/shop/files/red-ring1_3f2a9b1c-5d6e-4f70-8a9b-0c1d2e3f4a5b.webp?v=1712345
      https://store.com/cdn/shop/files/red-ring2.webp?v=1712345
      https://cdn.shopify.com/s/files/1/0123/4567/files/blue-ring-10.jpg?v=99
    `);
    expect(errors).toEqual([]);
    expect(images.map((i) => [i.handle, i.position, i.fileName])).toEqual([
      ["red-ring", 1, "red-ring1.webp"],
      ["red-ring", 2, "red-ring2.webp"],
      ["blue-ring", 10, "blue-ring-10.jpg"],
    ]);
  });

  it("reports invalid and duplicate URLs", () => {
    const { images, errors } = parseCdnUrls("not-a-url https://a.com/x1.jpg https://a.com/x1.jpg ftp://a.com/y1.jpg");
    expect(images).toHaveLength(1);
    expect(errors.map((e) => e.reason)).toEqual(["Not a valid URL", "Duplicate URL", "URL must start with https://"]);
  });

  it("uses known handles to resolve numbers in handles", () => {
    expect(splitHandleAndNumber("ring-20241", ["ring-2024"])).toEqual({ handle: "ring-2024", position: 1 });
    expect(splitHandleAndNumber("ring-20241")).toEqual({ handle: "ring", position: 20241 });
    expect(splitHandleAndNumber("logo")).toEqual({ handle: "logo", position: 0 });
  });
});
