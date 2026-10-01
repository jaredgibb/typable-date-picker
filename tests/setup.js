import { beforeEach, afterEach, vi } from "vitest";
import { ref, unref } from "vue";

beforeEach(() => {
  vi.stubGlobal("wwLib", {
    getFrontDocument: () => document,
    wwLang: { lang: "en" },
    wwEditorHelper: { EDIT_MODES: { EDITION: "edition" } },
    wwVariable: {
      useComponentVariable: ({ defaultValue }) => {
        const value = ref(unref(defaultValue));
        return { value, setValue: (next) => { value.value = next; } };
      },
    },
  });
  global.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
});
afterEach(() => { document.body.innerHTML = ""; vi.unstubAllGlobals(); });
