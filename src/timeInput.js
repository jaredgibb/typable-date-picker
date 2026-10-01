// Strict parsing is intentional: the upstream library accepts partial patterns.
export function parseTimeText(text) {
  if (text === "") return { valid: true, empty: true, value: null };
  if (typeof text !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text)) {
    return { valid: false, empty: false, value: null };
  }
  return { valid: true, empty: false, value: `${text}:00` };
}

export function timeTextFromValue(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) {
    return value.slice(0, 5);
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const { hours, minutes } = value;
    if (Number.isInteger(hours) && hours >= 0 && hours < 24 &&
        Number.isInteger(minutes) && minutes >= 0 && minutes < 60) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    return "";
  }
  // CIT hydrates browser-local time from a full canonical ISO timestamp.
  if (!(value instanceof Date) &&
      !(typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function parseLibraryInput(text) {
  const result = parseTimeText(text);
  if (!result.valid || result.empty) return null;
  const date = new Date();
  date.setHours(Number(text.slice(0, 2)), Number(text.slice(3)), 0, 0);
  return date;
}
