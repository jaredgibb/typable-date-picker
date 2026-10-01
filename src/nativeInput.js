import { timeTextFromValue } from "./timeInput.js";

export function nativeInputValue(value, mode) {
  if (value == null || value === "") return "";
  if (mode === "time") return timeTextFromValue(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (!(value instanceof Date) && !(typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validDate(value) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(value);
  if (!match || match[1] === "0000") return false;
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]);
}

export function nativeInputCandidate(input, mode, constraints = {}) {
  const text = input.value;
  const flags = input.validity || {};
  const incomplete = !text && Boolean(flags.badInput);
  // Required-field validation belongs to the host's Submit contract. Blank
  // remains valid syntax for draft Save; incomplete native segments do not.
  let valid = !flags.badInput && !flags.rangeUnderflow && !flags.rangeOverflow && !flags.stepMismatch;
  if (text) valid = valid && (mode === "date" ? validDate(text) : /^(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(text));
  if (valid && text && mode === "date") {
    const normalize = value => nativeInputValue(value, "date");
    const min = normalize(constraints.minDate), max = normalize(constraints.maxDate);
    if (min && text < min) valid = false;
    if (max && text > max) valid = false;
    if (Array.isArray(constraints.allowedDates) && constraints.allowedDates.length && !constraints.allowedDates.some(date => normalize(date) === text)) valid = false;
    if (Array.isArray(constraints.disabledDates) && constraints.disabledDates.some(date => normalize(date) === text)) valid = false;
    if (Array.isArray(constraints.disabledWeekDays) && constraints.disabledWeekDays.length) {
      const [year, month, day] = text.split("-").map(Number);
      const date = new Date(0); date.setFullYear(year, month - 1, day);
      if (constraints.disabledWeekDays.map(Number).includes(date.getDay())) valid = false;
    }
  }
  return { valid, incomplete, text, empty: !text && !incomplete, value: valid && text ? (mode === "time" ? `${text.slice(0, 5)}:00` : text) : null };
}
