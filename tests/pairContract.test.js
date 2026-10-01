import { it, expect, describe } from "vitest";
import { dateTimePair, incidentPairs } from "../demo/pairContract.js";

describe("example host pair contract", () => {
  it("preserves blank and half-complete drafts without producing a timestamp", () => {
    expect(dateTimePair(null, null)).toMatchObject({ status: "empty", timestamp: null });
    expect(dateTimePair("2026-10-01", null)).toMatchObject({ status: "incomplete", timestamp: null, error: "Choose both date and time to save this pair." });
    expect(dateTimePair(null, "21:34:00").status).toBe("incomplete");
  });
  it("combines calendar dates and times in the browser local timezone", () => {
    expect(dateTimePair("2026-10-01", "21:34:00").timestamp).toBe(new Date(2026, 9, 1, 21, 34).toISOString());
    expect(dateTimePair("2026-10-01", "00:00:00").timestamp).toBe(new Date(2026, 9, 1).toISOString());
  });
  it("rejects invalid dates/times rather than silently normalizing them", () => {
    expect(dateTimePair("2026-02-30", "14:30:00").status).toBe("invalid");
    expect(dateTimePair("2026-10-01", "25:30").status).toBe("invalid");
  });
  it("shows a placeholder until both timestamps are complete", () => {
    expect(incidentPairs({ arrivalDate: "2026-10-01", arrivalTime: "21:34:00" }).duration).toBe("—");
  });
  it("calculates 1 hr 15 min, permits equality, and blocks earlier Clear", () => {
    const values = { arrivalDate: "2026-10-01", arrivalTime: "21:34:00", clearDate: "2026-10-01", clearTime: "22:49:00" };
    expect(incidentPairs(values).duration).toBe("1 hr 15 min");
    expect(incidentPairs({ ...values, clearTime: "21:34:00" })).toMatchObject({ duration: "0 min", orderingError: "" });
    expect(incidentPairs({ ...values, clearTime: "20:34:00" })).toMatchObject({ duration: "—", orderingError: "Clear must follow Arrival" });
  });
  it("requires the next-day Clear date for overnight calls", () => {
    const values = { arrivalDate: "2026-10-01", arrivalTime: "23:45:00", clearDate: "2026-10-02", clearTime: "01:00:00" };
    expect(incidentPairs(values)).toMatchObject({ duration: "1 hr 15 min", orderingError: "" });
    expect(incidentPairs({ ...values, clearDate: "2026-10-01" }).orderingError).toBe("Clear must follow Arrival");
  });
});
