import { it, expect } from "vitest";
import { normalizeSegment, timeSegmentsCandidate } from "../src/timeSegments.js";
it("normalizes a single valid segment without clamping invalid input", () => {
  expect(normalizeSegment("9", 23)).toBe("09");
  expect(normalizeSegment("25", 23)).toBe("25");
  expect(normalizeSegment("75", 59)).toBe("75");
  expect(normalizeSegment("", 23)).toBe("");
  expect(normalizeSegment("xx", 23)).toBe("xx");
});
it("distinguishes empty, partial, invalid, and complete pairs", () => {
  expect(timeSegmentsCandidate("", "")).toMatchObject({ valid: true, empty: true, value: null });
  expect(timeSegmentsCandidate("14", "")).toMatchObject({ valid: false, incomplete: true, text: "14:" });
  expect(timeSegmentsCandidate("25", "30").valid).toBe(false);
  expect(timeSegmentsCandidate("14", "75").valid).toBe(false);
  expect(timeSegmentsCandidate("14", "30")).toMatchObject({ valid: true, value: "14:30:00" });
});
