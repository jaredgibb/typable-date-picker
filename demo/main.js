import { createApp, ref, unref, h } from "vue";
import App from "./App.vue";

// Minimal WeWeb host for local component QA; no backend or real application data.
window.wwLib = {
  getFrontDocument: () => document,
  wwLang: { lang: "en" },
  wwEditorHelper: { EDIT_MODES: { EDITION: "edition" } },
  wwVariable: { useComponentVariable: ({ defaultValue }) => {
    const value = ref(unref(defaultValue));
    return { value, setValue: (next) => { value.value = next; } };
  } },
};
const app = createApp(App);
app.component("wwLayoutItemContext", { inheritAttrs: false, setup: (_, { slots }) => () => slots.default?.() });
app.component("wwLayout", { render: () => h("button", { type: "button" }, "Open legacy picker") });
app.component("wwElement", { render: () => h("button", { type: "button" }, "Select time") });
app.mount("#app");
