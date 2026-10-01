<script setup>
import { ref } from "vue";
import Element from "../src/wwElement.vue";
import config from "../ww-config.js";
const picker = ref(null);
const events = ref([]);
const status = ref("Ready");
const formSubmits = ref(0);
const defaults = Object.fromEntries(Object.entries(config.properties).map(([name, property]) => [name, property.defaultValue]));
const content = ref({ ...defaults,
  dateMode: "time", selectionMode: "single", use24: true, allowTyping: true,
  autoApply: false, closeOnAutoApply: false, customFormat: "HH:mm", format: "custom",
  inputLabel: "Arrival time", themeFontFamily: "Arial, sans-serif", themeFontSize: "14px",
  themePrimaryColor: "#253F3E", themeTextColor: "#1A2C2B", themeBorderColor: "#D4DFDE", themeBorderRadius: "6px",
  themeBackgroundColor: "#FFFFFF", themeSecondaryColor: "#D4DFDE",
});
function onEvent(event) {
  if (event.name === "change") events.value.push(event.event.value);
}
async function save() {
  const result = await picker.value.commitInput();
  status.value = !result.valid ? `Blocked: invalid time ${result.text}`
    : result.hasUncommittedInput ? "Blocked: an edit is still pending"
    : `Saved ${result.value ?? "null"}`;
}
function hydrate() { content.value = { ...content.value, initValueSingle: "2026-09-15T14:24:00.000Z" }; }
function reset() { picker.value.clearValue(); status.value = "Reset"; }
</script>

<template>
  <main>
    <h1>Type a time. Keep the picker.</h1>
    <p>Enter an exact 24-hour time, or use the clock and Select time.</p>
    <form @submit.prevent="formSubmits++">
      <Element ref="picker" :content="content" uid="demo" :ww-element-state="{ props: {}, states: [] }" :ww-editor-state="{ editMode: 'preview' }" @trigger-event="onEvent" />
      <label class="next-label">Next field<input aria-label="Next field" placeholder="Tab advances here"></label>
      <div class="buttons">
        <button type="button" @click="save" @mousedown.prevent>Save before blur</button>
        <button type="button" @click="hydrate">Hydrate ISO value</button>
        <button type="button" @click="reset">Reset</button>
      </div>
      <label class="switch"><input type="checkbox" v-model="content.readonly">Read only</label>
    </form>
    <output aria-live="polite">{{ status }}</output>
    <p class="evidence">Form submits: {{ formSubmits }}</p>
    <p class="evidence">Change events: {{ JSON.stringify(events) }}</p>
  </main>
</template>

<style>
* { box-sizing: border-box; }
body { margin: 0; background: #EAF0EF; color: #1A2C2B; font: 14px/1.5 Arial, sans-serif; }
main { max-width: 560px; margin: 72px auto; padding: 32px; border-radius: 16px; background: white; }
h1 { margin-top: 0; font-size: 26px; }
form { margin: 24px 0; }
.next-label { display: block; margin-top: 20px; }
.next-label input { display: block; width: 100%; height: 40px; padding: 8px 12px; border: 1px solid #D4DFDE; border-radius: 6px; font: inherit; }
.buttons { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
.buttons button { padding: 8px 12px; border: 0; border-radius: 6px; background: #253F3E; color: white; font: inherit; cursor: pointer; }
.switch { display: flex; gap: 8px; }
output { display: block; padding: 12px; background: #EAF0EF; border-radius: 6px; }
.evidence { overflow-wrap: anywhere; font-family: monospace; }
@media (max-width: 600px) { main { margin: 16px; padding: 24px; } }
</style>
