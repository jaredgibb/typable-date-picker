<script setup>
import { ref, computed, nextTick } from "vue";
import Element from "../src/wwElement.vue";
import config from "../ww-config.js";
import { incidentPairs } from "./pairContract.js";
const fields = [
  { key: "arrivalDate", label: "Arrival date", mode: "date" },
  { key: "arrivalTime", label: "Arrival time", mode: "time" },
  { key: "clearDate", label: "Clear date", mode: "date" },
  { key: "clearTime", label: "Clear time", mode: "time" },
];
const controls = {};
const status = ref("Ready");
const formSubmits = ref(0);
const events = ref([]);
const checkpoints = ref([]);
const readonly = ref(false);
const alternateStyle = ref(false);
const use24 = ref(false);
const defaults = Object.fromEntries(Object.entries(config.properties).map(([name, property]) => [name, property.defaultValue]));
const initial = ref({});
const values = ref(Object.fromEntries(fields.map(field => [field.key, null])));
const pairs = computed(() => incidentPairs(values.value));
function content(field) {
  const error = field.key.startsWith("arrival") ? pairs.value.arrival.error : pairs.value.orderingError || pairs.value.clear.error;
  return { ...defaults, dateMode: field.mode, selectionMode: "single", allowTyping: true, use24: use24.value,
    readonly: readonly.value, required: true, initValueSingle: initial.value[field.key] ?? null,
    inputLabel: field.label, inputErrorMessage: error,
    themeFontFamily: "Arial, sans-serif", themeFontSize: alternateStyle.value ? "16px" : "12px",
    themeTextColor: "#1A2C2B", themeBorderColor: alternateStyle.value ? "#456BB3" : "#D4DFDE",
    themeBorderRadius: alternateStyle.value ? "14px" : "6px", themeBackgroundColor: "#FFFFFF",
    inputHeight: alternateStyle.value ? "52px" : "40px", inputFocusColor: "#5C7574", themeDangerColor: "#966844",
  };
}
async function onEvent(field, event) {
  if (event.name === "initValueChange") values.value[field.key] = event.event.value;
  if (event.name !== "change") return;
  events.value.push({ field: field.key, value: event.event.value });
  values.value[field.key] = event.event.value;
  await nextTick();
  const pair = field.key.startsWith("arrival") ? pairs.value.arrival : pairs.value.clear;
  if (pair.status === "complete" && !pairs.value.orderingError) checkpoints.value.push({ pair: field.key.startsWith("arrival") ? "arrival" : "clear", timestamp: pair.timestamp });
}
async function save() {
  const states = await Promise.all(fields.map(field => controls[field.key].commitInput()));
  values.value = Object.fromEntries(fields.map((field, index) => [field.key, states[index].value]));
  if (states.some(state => !state.valid || state.hasUncommittedInput)) { status.value = "Blocked: complete or clear the partially edited field"; return; }
  if (pairs.value.orderingError) { status.value = `Blocked: ${pairs.value.orderingError}`; return; }
  if ([pairs.value.arrival, pairs.value.clear].some(pair => pair.status === "invalid")) { status.value = "Blocked: invalid pair"; return; }
  status.value = `Draft saved: ${JSON.stringify(values.value)}; timestamps: ${JSON.stringify({ arrival: pairs.value.arrival.timestamp, clear: pairs.value.clear.timestamp })}`;
}
function hydrate() {
  initial.value = { arrivalDate: "2026-10-01", arrivalTime: "21:34:00", clearDate: "2026-10-01", clearTime: "22:49:00" };
}
async function reset() {
  for (const control of Object.values(controls)) control.clearValue();
  values.value = Object.fromEntries(fields.map(field => [field.key, null]));
  await nextTick(); status.value = "Reset";
}
async function cancel() {
  for (const control of Object.values(controls)) control.resetInput();
  await nextTick(); status.value = "Pending edits cancelled";
}
</script>

<template>
  <main>
    <h1>Editable segments. Flexible styles.</h1>
    <p>Enter date/time segments without typing separators. Use browser pickers, or enable 24-hour time to enforce HH:mm in the field and picker.</p>
    <form novalidate @submit.prevent="formSubmits++">
      <div class="fields">
        <Element v-for="field in fields" :key="field.key" :ref="control => { if (control) controls[field.key] = control; }" :content="content(field)" :uid="field.key" :ww-element-state="{ props: {}, states: [] }" :ww-editor-state="{ editMode: 'preview' }" @trigger-event="onEvent(field, $event)" />
      </div>
      <p>Time on scene: <strong>{{ pairs.duration }}</strong></p>
      <label class="next-label">Next field<input aria-label="Next field" placeholder="Tab advances here"></label>
      <div class="buttons">
        <button type="button" @click="save" @mousedown.prevent>Save before blur</button>
        <button type="button" @click="hydrate">Hydrate example</button>
        <button type="button" @click="cancel" @mousedown.prevent>Cancel pending edits</button>
        <button type="button" @click="reset">Reset</button>
      </div>
      <label class="switch"><input type="checkbox" v-model="use24">24-hour time</label>
      <label class="switch"><input type="checkbox" v-model="readonly">Read only</label>
      <label class="switch"><input type="checkbox" v-model="alternateStyle">Try alternate styling</label>
    </form>
    <output aria-live="polite">{{ status }}</output>
    <p class="evidence">Form submits: {{ formSubmits }}</p>
    <p class="evidence">Committed values: {{ JSON.stringify(values) }}</p>
    <p class="evidence">Change events: {{ JSON.stringify(events) }}</p>
    <p class="evidence">Example autosave timestamps: {{ JSON.stringify(checkpoints) }}</p>
    <p class="note">Local component harness only. No CIT checkpoints or backend requests are sent. Blank/incomplete pairs can be saved in drafts; partially edited native fields must be completed or cleared.</p>
  </main>
</template>

<style>
* { box-sizing: border-box; }
body { margin: 0; background: #EAF0EF; color: #1A2C2B; font: 14px/1.5 Arial, sans-serif; }
main { max-width: 720px; margin: 48px auto; padding: 32px; border-radius: 16px; background: white; }
h1 { margin-top: 0; font-size: 26px; }
form { margin: 24px 0; }
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 18px; }
.next-label { display: block; margin-top: 20px; }
.next-label input { display: block; width: 100%; height: 40px; padding: 8px 12px; border: 1px solid #D4DFDE; border-radius: 6px; font: inherit; }
.buttons { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
.buttons button { padding: 8px 12px; border: 0; border-radius: 6px; background: #253F3E; color: white; font: inherit; cursor: pointer; }
.switch { display: flex; gap: 8px; }
output { display: block; padding: 12px; background: #EAF0EF; border-radius: 6px; overflow-wrap: anywhere; }
.evidence { overflow-wrap: anywhere; font-family: monospace; font-size: 11px; }
.note { font-size: 12px; color: #4C6D6B; }
@media (max-width: 600px) { main { margin: 16px; padding: 24px; } .fields { grid-template-columns: 1fr; } }
</style>
