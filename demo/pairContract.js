import { nativeInputCandidate, nativeInputValue } from "../src/nativeInput.js";

// Example host-form contract only. The individual component never writes a
// timestamp or bypasses the host's checkpoint queue.
export function dateTimePair(dateValue, timeValue) {
  if (!dateValue && !timeValue) return { status: "empty", timestamp: null, error: "" };
  if (!dateValue || !timeValue) return { status: "incomplete", timestamp: null, error: "Choose both date and time to save this pair." };
  const date = nativeInputValue(dateValue, "date"), time = nativeInputValue(timeValue, "time");
  if (!date || !time || !nativeInputCandidate({ value: date }, "date").valid || !nativeInputCandidate({ value: time }, "time").valid)
    return { status: "invalid", timestamp: null, error: "Choose a valid date and time." };
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const local = new Date(0);
  local.setFullYear(year, month - 1, day);
  local.setHours(hours, minutes, 0, 0);
  if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day || local.getHours() !== hours || local.getMinutes() !== minutes)
    return { status: "invalid", timestamp: null, error: "This local time does not exist on the selected date." };
  return { status: "complete", timestamp: local.toISOString(), error: "" };
}

export function incidentPairs(values) {
  const arrival = dateTimePair(values.arrivalDate, values.arrivalTime);
  const clear = dateTimePair(values.clearDate, values.clearTime);
  let duration = "—";
  let orderingError = "";
  if (arrival.timestamp && clear.timestamp) {
    const minutes = (Date.parse(clear.timestamp) - Date.parse(arrival.timestamp)) / 60000;
    if (minutes < 0) orderingError = "Clear must follow Arrival";
    else {
      const hours = Math.floor(minutes / 60), remaining = minutes % 60;
      duration = hours ? `${hours} hr${remaining ? ` ${remaining} min` : ""}` : `${remaining} min`;
    }
  }
  return { arrival, clear, orderingError, duration };
}
