import { describe, expect, it } from "vitest";
import { buildRenamePreview, generateImageName } from "./image-naming";
import { moveItem, sortByMode } from "./image-sorting";
import { checkImageFile } from "./image-validation";

describe("image naming", () => {
  it("generates handle + number + ext", () => {
    expect(generateImageName("red-ring", 1, "webp")).toBe("red-ring1.webp");
    expect(generateImageName("red-ring", 2, ".JPG")).toBe("red-ring2.jpg");
    expect(generateImageName("red-ring", 3, "png", { separator: "-" })).toBe("red-ring-3.png");
    expect(generateImageName("red-ring-2", 1, "jpg")).toBe("red-ring-2-1.jpg");
  });

  it("builds a preview starting from startNumber", () => {
    const files = [
      { id: "a", originalName: "IMG_1.jpg", extension: "jpg" },
      { id: "b", originalName: "IMG_2.webp", extension: "webp" },
    ];
    expect(buildRenamePreview(files, "red-ring", 5).map((p) => p.newName)).toEqual([
      "red-ring5.jpg",
      "red-ring6.webp",
    ]);
  });
});

describe("image sorting", () => {
  const names = ["img10.jpg", "img2.jpg", "img1.jpg"];
  it("sorts naturally", () => {
    expect(sortByMode(names, "nameAsc", (n) => n)).toEqual(["img1.jpg", "img2.jpg", "img10.jpg"]);
    expect(sortByMode(names, "nameDesc", (n) => n)).toEqual(["img10.jpg", "img2.jpg", "img1.jpg"]);
    expect(sortByMode(names, "selection", (n) => n)).toEqual(names);
  });
  it("moves items", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 0, 5)).toEqual([1, 2, 3]);
  });
});

describe("image validation", () => {
  it("rejects non-images and junk", () => {
    expect(checkImageFile({ name: "a.txt", size: 10, type: "text/plain" }).ok).toBe(false);
    expect(checkImageFile({ name: ".DS_Store", size: 10, type: "" }).ok).toBe(false);
    expect(checkImageFile({ name: "a.jpg", size: 0, type: "image/jpeg" }).ok).toBe(false);
    expect(checkImageFile({ name: "a.JPG", size: 10, type: "" }).ok).toBe(true);
  });
});
