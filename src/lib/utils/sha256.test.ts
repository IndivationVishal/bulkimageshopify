import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256 } from "./sha256";

describe("sha256", () => {
  it("matches node's implementation", () => {
    for (const input of ["", "abc", "héllo ✨", "x".repeat(55), "y".repeat(64), "z".repeat(1000)]) {
      expect(sha256(input)).toBe(createHash("sha256").update(input).digest("hex"));
    }
  });
});
