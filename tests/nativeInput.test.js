import { describe, it, expect } from "vitest";
import { nativeInputValue, nativeInputCandidate } from "../src/nativeInput.js";
const input = (value, validity = {}) => ({ value, validity });

describe("native values and validity", () => {
  it("adapts existing time values and ISO hydration to native HH:mm", () => {
    expect(nativeInputValue("21:34:00", "time")).toBe("21:34");
    const date = new Date(2026, 9, 1, 21, 34);
    expect(nativeInputValue(date.toISOString(), "time")).toBe("21:34");
    expect(nativeInputValue(date.toISOString(), "date")).toBe("2026-10-01");
    expect(nativeInputValue("2026-10-01", "date")).toBe("2026-10-01");
    expect(nativeInputValue(null, "date")).toBe("");
    expect(nativeInputValue("invalid", "date")).toBe("");
  });
  it.each(["00:00", "21:34", "23:59"])("preserves canonical time output for %s", value => {
    expect(nativeInputCandidate(input(value), "time")).toMatchObject({ valid: true, value: `${value}:00` });
  });
  it.each(["25:30", "14:75", "1", "9:34", "14:30:01"])("rejects invalid time %s without normalization", value => {
    expect(nativeInputCandidate(input(value), "time").valid).toBe(false);
  });
  it("distinguishes incomplete native segments from a deliberately blank field", () => {
    expect(nativeInputCandidate(input("", { badInput: true }), "time")).toMatchObject({ valid: false, incomplete: true, empty: false });
    expect(nativeInputCandidate(input("", { valueMissing: true }), "time")).toMatchObject({ valid: true, incomplete: false, empty: true, value: null });
  });
  it.each(["2024-02-29", "2026-10-01", "0001-01-01"])("accepts a real date %s", value => {
    expect(nativeInputCandidate(input(value), "date")).toMatchObject({ valid: true, value });
  });
  it.each(["2026-02-29", "2026-04-31", "0000-01-01", "2026-13-01", "10/01/2026"])("rejects invalid date %s", value => {
    expect(nativeInputCandidate(input(value), "date").valid).toBe(false);
  });
  it.each(["rangeUnderflow", "rangeOverflow", "stepMismatch", "badInput"])("honors native %s", flag => {
    expect(nativeInputCandidate(input("21:34", { [flag]: true }), "time").valid).toBe(false);
  });
  it("can recover from our previous custom validity error", () => {
    expect(nativeInputCandidate(input("21:34", { customError: true }), "time").valid).toBe(true);
  });
  it("checks date limits, disabled dates/weekdays, and allowed dates", () => {
    const candidate = constraints => nativeInputCandidate(input("2026-10-01"), "date", constraints).valid;
    expect(candidate({ minDate: "2026-10-02" })).toBe(false);
    expect(candidate({ maxDate: "2026-09-30" })).toBe(false);
    expect(candidate({ disabledDates: ["2026-10-01"] })).toBe(false);
    expect(candidate({ disabledWeekDays: [4] })).toBe(false);
    expect(candidate({ allowedDates: ["2026-10-02"] })).toBe(false);
    expect(candidate({ minDate: "2026-10-01", maxDate: "2026-10-01", allowedDates: ["2026-10-01"] })).toBe(true);
  });
});
