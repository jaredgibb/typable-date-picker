<template>
  <div class="time24-control" :class="{ 'time24-invalid': invalid }" role="group" :aria-label="`${label} (24-hour)`" @click.stop @focusout="handleFocusOut">
    <input :id="id" ref="hoursInput" class="time24-segment" type="text" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="--"
      :value="hours" :readonly="readonly" :required="required" :aria-label="`${label} hours (24-hour)`" :aria-invalid="invalid" :aria-describedby="describedBy"
      @focus="selectSegment('hours')" @input="handleInput('hours', $event)" @keydown="handleKeydown('hours', $event)" @paste="handlePaste($event)" />
    <span class="time24-separator" aria-hidden="true">:</span>
    <input :id="`${id}-minutes`" ref="minutesInput" class="time24-segment" type="text" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="--"
      :value="minutes" :readonly="readonly" :required="required" :aria-label="`${label} minutes`" :aria-invalid="invalid" :aria-describedby="describedBy"
      @focus="selectSegment('minutes')" @input="handleInput('minutes', $event)" @keydown="handleKeydown('minutes', $event)" @paste="handlePaste($event)" />
    <button type="button" class="time24-clock" :aria-label="clockLabel" aria-haspopup="dialog" :aria-expanded="pickerOpen" :disabled="readonly"
      @mousedown.prevent @click="$emit('open')">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>
</template>

<script>
import { normalizeSegment, timeSegmentsCandidate } from "./timeSegments.js";
export default {
  props: {
    id: { type: String, required: true }, label: { type: String, default: "Time" },
    clockLabel: { type: String, default: "Open time picker" },
    readonly: Boolean, required: Boolean, invalid: Boolean, describedBy: String, pickerOpen: Boolean,
  },
  emits: ["input", "commit", "open"],
  data() { return { hours: "", minutes: "", lastSegment: "hours" }; },
  methods: {
    getCandidate() {
      return timeSegmentsCandidate(this.$refs.hoursInput?.value ?? this.hours, this.$refs.minutesInput?.value ?? this.minutes);
    },
    setPart(part, value) {
      this[part] = value;
      const input = this.$refs[`${part}Input`];
      if (input && input.value !== value) input.value = value;
    },
    setValue(text) {
      const [hours = "", minutes = ""] = text ? text.split(":") : [];
      this.setPart("hours", hours); this.setPart("minutes", minutes);
    },
    normalizeSegments() {
      for (const [part, maximum] of [["hours", 23], ["minutes", 59]]) {
        const input = this.$refs[`${part}Input`];
        this.setPart(part, normalizeSegment(input?.value ?? this[part], maximum));
      }
    },
    setCustomValidity(message) {
      this.$refs.hoursInput?.setCustomValidity(message);
      this.$refs.minutesInput?.setCustomValidity(message);
    },
    focus(part = this.lastSegment) { this.$refs[`${part}Input`]?.focus(); },
    selectSegment(part) { this.lastSegment = part; this.$refs[`${part}Input`]?.select(); },
    handleInput(part, event) {
      if (this.readonly) return;
      const maximum = part === "hours" ? 23 : 59;
      const text = event.target.value;
      const complete = /^\d{2}$/.test(text) && Number(text) <= maximum || /^\d$/.test(text) && Number(text) > (part === "hours" ? 2 : 5);
      this.setPart(part, complete ? normalizeSegment(text, maximum) : text);
      this.$emit("input", this.getCandidate());
      if (part === "hours" && complete) this.$nextTick(() => this.focus("minutes"));
    },
    handleKeydown(part, event) {
      if (event.key === "Enter") {
        event.preventDefault(); event.stopPropagation();
        if (!this.readonly) { this.normalizeSegments(); this.$emit("commit", "enter"); }
        return;
      }
      if (this.readonly) return;
      if (event.key === ":") {
        event.preventDefault();
        if (part === "hours") {
          this.setPart(part, normalizeSegment(this.$refs.hoursInput.value, 23));
          this.$emit("input", this.getCandidate()); this.focus("minutes");
        }
        return;
      }
      if (event.key === "Tab") { this.normalizeSegments(); this.$emit("commit", "tab"); return; }
      if (event.key === "ArrowRight" && part === "hours" || event.key === "ArrowLeft" && part === "minutes") {
        event.preventDefault(); this.focus(part === "hours" ? "minutes" : "hours"); return;
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault(); this.setPart(part, ""); this.$emit("input", this.getCandidate()); return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const maximum = part === "hours" ? 23 : 59, text = this.$refs[`${part}Input`].value;
        const valid = /^\d{1,2}$/.test(text) && Number(text) <= maximum;
        const value = valid ? (Number(text) + (event.key === "ArrowUp" ? 1 : -1) + maximum + 1) % (maximum + 1) : event.key === "ArrowUp" ? 0 : maximum;
        this.setPart(part, String(value).padStart(2, "0")); this.$emit("input", this.getCandidate()); this.selectSegment(part);
      }
    },
    handlePaste(event) {
      if (this.readonly) return;
      const text = event.clipboardData?.getData("text");
      if (!/^\d{2}:?\d{2}$/.test(text || "")) return;
      event.preventDefault();
      const digits = text.replace(":", "");
      this.setPart("hours", digits.slice(0, 2)); this.setPart("minutes", digits.slice(2));
      this.$emit("input", this.getCandidate()); this.focus("minutes");
    },
    handleFocusOut(event) {
      if (this.pickerOpen || this.$el.contains(event.relatedTarget)) return;
      if (!this.readonly) { this.normalizeSegments(); this.$emit("commit", "blur"); }
    },
  },
};
</script>

<style scoped>
.time24-control { display: flex; align-items: center; width: 100%; min-width: 0; min-height: var(--typing-height); box-sizing: border-box; padding: 10px 11px 8px; border: var(--typing-border-width) solid var(--typing-border); border-radius: var(--typing-radius); background: var(--typing-background); color: var(--typing-text); box-shadow: var(--typing-shadow); font: inherit; line-height: 1.4; }
.time24-control:focus-within { outline: var(--typing-focus-width) solid var(--typing-focus); outline-offset: var(--typing-focus-offset); }
.time24-segment { box-sizing: content-box; width: 2.3ch; min-width: 0; padding: 0; border: 0; border-radius: 1px; outline: none; background: transparent; font: inherit; line-height: inherit; color: inherit; text-align: center; }
.time24-segment::placeholder { opacity: 1; color: inherit; }
.time24-segment:focus { background: Highlight; color: HighlightText; }
.time24-segment:read-only:focus { background: transparent; color: inherit; }
.time24-separator { flex: 0 0 auto; }
.time24-clock { display: inline-flex; align-items: center; justify-content: center; margin-left: auto; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; }
.time24-clock:focus-visible { outline: 2px solid var(--typing-focus); outline-offset: 3px; }
.time24-clock:disabled { cursor: default; }
.time24-control.time24-invalid { border-color: var(--typing-danger); background: var(--typing-error-background); }
@media (forced-colors: active) { .time24-control:focus-within { outline: 2px solid Highlight; } }
</style>
