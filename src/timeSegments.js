import { parseTimeText } from "./timeInput.js";

export function normalizeSegment(value, maximum) {
  return /^\d{1,2}$/.test(value) && Number(value) <= maximum ? value.padStart(2, "0") : value;
}

export function timeSegmentsCandidate(hours, minutes) {
  const text = hours || minutes ? `${hours}:${minutes}` : "";
  const parsed = parseTimeText(text);
  return { ...parsed, text, incomplete: Boolean(text && !parsed.valid) };
}
