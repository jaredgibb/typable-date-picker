import { describe, it, expect } from "vitest";
import { parseTimeText, parseLibraryInput, timeTextFromValue } from "../src/timeInput.js";

describe("strict time contract", () => {
  it.each(["00:00", "14:30", "23:59"])("accepts %s without changing its meaning", (text) => {
    expect(parseTimeText(text)).toEqual({ valid: true, empty: false, value: `${text}:00` });
    const date = parseLibraryInput(text);
    expect(date.getHours()).toBe(Number(text.slice(0, 2)));
    expect(date.getMinutes()).toBe(Number(text.slice(3)));
    expect(date.getSeconds()).toBe(0);
  });
  it.each(["25:30", "14:75", "1", "14:", "4:30", "14:3", "24:00", "14:30:00", " 14:30", "14:30 ", "2pm"])("rejects %s", (text) => {
    expect(parseTimeText(text).valid).toBe(false);
    expect(parseLibraryInput(text)).toBe(null);
  });
  it("treats blank as a valid clear, not a required-field decision", () => {
    expect(parseTimeText("")).toEqual({ valid: true, empty: true, value: null });
  });
  it("hydrates ISO values using their browser-local hour/minute", () => {
    const date = new Date("2026-09-15T14:24:00.000Z");
    const expected = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    expect(timeTextFromValue(date.toISOString())).toBe(expected);
  });
  it("accepts legacy time strings and library objects but does not coerce partial strings", () => {
    expect(timeTextFromValue("14:30:00")).toBe("14:30");
    expect(timeTextFromValue({ hours: 0, minutes: 0 })).toBe("00:00");
    expect(timeTextFromValue("1")).toBe("");
    expect(timeTextFromValue(null)).toBe("");
  });
});
