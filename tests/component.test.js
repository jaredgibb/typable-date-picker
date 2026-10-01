import { mount, flushPromises } from "@vue/test-utils";
import { h, nextTick } from "vue";
import { describe, it, expect, afterEach } from "vitest";
import Element from "../src/wwElement.vue";
import config from "../ww-config.js";

const wrappers = [];
afterEach(() => { for (const wrapper of wrappers.splice(0)) wrapper.unmount(); });
function create(overrides = {}) {
  const content = Object.fromEntries(Object.entries(config.properties).map(([name, property]) => [name, property.defaultValue]));
  Object.assign(content, { dateMode: "time", selectionMode: "single", use24: true, allowTyping: true, autoApply: false }, overrides);
  const wrapper = mount(Element, {
    attachTo: document.body,
    props: { content, uid: `test-${wrappers.length}`, wwElementState: { props: {}, states: [] }, wwEditorState: { editMode: "preview" } },
    global: { config: { warnHandler(message) {
      // Upstream 3.6.8 accepts the front-document body target at runtime, but its
      // prop declaration omits HTMLElement; dpStyle also predates this library.
      if (message.includes('Invalid prop: type check failed for prop "teleport"') ||
          message.startsWith('Extraneous non-props attributes (dpStyle)')) return;
      throw new Error(message);
    } }, components: {
      wwLayoutItemContext: { inheritAttrs: false, setup: (_, { slots }) => () => slots.default?.() },
      wwLayout: { render: () => h("button", { type: "button" }, "Legacy trigger") },
      wwElement: { render: () => h("button", { type: "button" }, "Select") },
    } },
  });
  wrappers.push(wrapper);
  return wrapper;
}
const changes = (wrapper) => (wrapper.emitted("trigger-event") || []).map(([event]) => event).filter((event) => event.name === "change");

describe("component with the real vendored picker", () => {
  it("defaults Allow typing off and preserves the legacy trigger", () => {
    expect(config.properties.allowTyping.defaultValue).toBe(false);
    const wrapper = create({ allowTyping: false });
    expect(wrapper.find(".typing-input").exists()).toBe(false);
    expect(wrapper.text()).toContain("Legacy trigger");
  });
  it.each([{ dateMode: "date" }, { selectionMode: "range" }, { use24: false }, { enableSeconds: true }, { enableCalendarOnly: true }])("keeps unsupported modes on the existing path (%j)", (override) => {
    expect(create(override).find(".typing-input").exists()).toBe(false);
  });
  it("keeps valid text pending, commits Enter once, and prevents form submission", async () => {
    const wrapper = create();
    const input = wrapper.get(".typing-input");
    await input.setValue("14:30");
    expect(wrapper.vm.variableValue).toBe(null);
    expect(wrapper.vm.getInputState().hasUncommittedInput).toBe(true);
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    input.element.dispatchEvent(event);
    await flushPromises();
    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.vm.variableValue).toBe("14:30:00");
    await input.trigger("blur");
    await wrapper.vm.commitInput();
    expect(changes(wrapper)).toHaveLength(1);
  });
  it("Tab advances normally and a following blur does not duplicate the commit", async () => {
    const wrapper = create();
    const input = wrapper.get(".typing-input");
    await input.setValue("00:00");
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    input.element.dispatchEvent(event);
    input.element.dispatchEvent(new FocusEvent("blur"));
    await flushPromises();
    expect(event.defaultPrevented).toBe(false);
    expect(wrapper.vm.variableValue).toBe("00:00:00");
    expect(changes(wrapper)).toHaveLength(1);
  });
  it("commits field exit and captures Save before blur via the exposed action", async () => {
    const wrapper = create();
    const input = wrapper.get(".typing-input");
    await input.setValue("23:59");
    await input.trigger("blur");
    await flushPromises();
    expect(wrapper.vm.variableValue).toBe("23:59:00");
    await input.setValue("08:09");
    const result = await wrapper.vm.commitInput();
    expect(result).toMatchObject({ valid: true, value: "08:09:00", hasUncommittedInput: false });
    expect(changes(wrapper)).toHaveLength(2);
  });
  it.each(["25:30", "14:75", "1"])("retains invalid %s and exposes a blocking Save state", async (text) => {
    const wrapper = create({ initValueSingle: "14:30:00" });
    await wrapper.get(".typing-input").setValue(text);
    const result = await wrapper.vm.commitInput();
    expect(result).toMatchObject({ valid: false, text, value: "14:30:00", hasUncommittedInput: true });
    expect(wrapper.get(".typing-input").element.value).toBe(text);
    expect(wrapper.get(".typing-input").attributes("aria-invalid")).toBe("true");
    expect(wrapper.get(".typing-input").element.validity.customError).toBe(true);
    expect(changes(wrapper)).toHaveLength(0);
  });
  it("clears through the library, emits null once, and never retains the previous time", async () => {
    const wrapper = create({ initValueSingle: "14:30:00" });
    await wrapper.get(".typing-input").setValue("");
    await wrapper.vm.commitInput();
    expect(wrapper.vm.variableValue).toBe(null);
    expect(wrapper.vm.inputText).toBe("");
    expect(changes(wrapper)).toEqual([{ name: "change", event: { value: null } }]);
  });
  it("hydration and reset replace both values without checkpoint events", async () => {
    const wrapper = create({ initValueSingle: "2026-09-15T14:24:00.000Z" });
    expect(wrapper.vm.variableValue).toBe("2026-09-15T14:24:00.000Z");
    expect(wrapper.vm.inputText).toMatch(/^\d\d:\d\d$/);
    await wrapper.get(".typing-input").setValue("1");
    wrapper.vm.clearValue();
    await nextTick();
    expect(wrapper.vm.getInputState()).toMatchObject({ value: null, text: "", valid: true, hasUncommittedInput: false });
    await wrapper.setProps({ content: { ...wrapper.props("content"), initValueSingle: "06:07:00" } });
    expect(wrapper.vm.inputText).toBe("06:07");
    expect(changes(wrapper)).toHaveLength(0);
  });
  it("keeps an in-progress invalid edit when autosave echoes the same minute", async () => {
    const wrapper = create({ initValueSingle: "14:30:00" });
    await wrapper.get(".typing-input").setValue("1");
    wrapper.vm.setValue("14:30");
    await nextTick();
    expect(wrapper.vm.inputText).toBe("1");
    expect(wrapper.vm.inputValid).toBe(false);
  });
  it("cancels an older pending commit when a newer edit arrives", async () => {
    const wrapper = create();
    const input = wrapper.get(".typing-input");
    await input.setValue("14:30");
    const pending = wrapper.vm.commitInput();
    input.element.value = "15:45";
    input.element.dispatchEvent(new Event("input", { bubbles: true }));
    await pending;
    expect(changes(wrapper)).toHaveLength(0);
    await wrapper.vm.commitInput();
    expect(wrapper.vm.variableValue).toBe("15:45:00");
    expect(changes(wrapper)).toHaveLength(1);
  });
  it("does not checkpoint when moving from the input into the picker", async () => {
    const wrapper = create();
    const input = wrapper.get(".typing-input");
    await input.setValue("14:30");
    input.element.dispatchEvent(new FocusEvent("blur", { relatedTarget: wrapper.get(".typing-clock").element }));
    await wrapper.get(".typing-clock").trigger("click");
    await flushPromises();
    expect(changes(wrapper)).toHaveLength(0);
    expect(wrapper.vm.pickerOpen).toBe(true);
    const hours = document.querySelector('[aria-label="Open hours overlay"]');
    const minutes = document.querySelector('[aria-label="Open minutes overlay"]');
    expect(hours.textContent).toBe("14");
    expect(minutes.textContent).toBe("30");
  });
  it("blocks typing and opening in read-only mode", async () => {
    const wrapper = create({ initValueSingle: "14:30:00", readonly: true });
    expect(wrapper.get(".typing-input").attributes()).toHaveProperty("readonly");
    expect(wrapper.get(".typing-clock").attributes()).toHaveProperty("disabled");
    await wrapper.get(".typing-input").setValue("15:00");
    await wrapper.vm.commitInput();
    expect(wrapper.vm.variableValue).toBe("14:30:00");
    expect(changes(wrapper)).toHaveLength(0);
  });
  it("has an associated label and a named clock button", () => {
    const wrapper = create({ inputLabel: "Arrival time" });
    expect(wrapper.get("label").attributes("for")).toBe(wrapper.get(".typing-input").attributes("id"));
    expect(wrapper.get("label").text()).toBe("Arrival time");
    expect(wrapper.get(".typing-clock").attributes("aria-label")).toBe("Open time picker");
    expect(wrapper.findAll('input[type="text"]')).toHaveLength(1);
  });
  it("preserves Select time, updates the same input, and restores focus on confirmation and Escape", async () => {
    const wrapper = create({ initValueSingle: "14:30:00" });
    await wrapper.get(".typing-clock").trigger("click");
    await flushPromises();
    expect(wrapper.vm.pickerOpen).toBe(true);
    const button = Array.from(document.querySelectorAll("button")).find((node) => node.textContent === "Select time");
    expect(button).toBeTruthy();
    wrapper.vm.wwDatePicker.updateInternalModelValue(new Date(2026, 9, 1, 16, 45));
    await nextTick();
    button.click();
    await flushPromises();
    expect(wrapper.vm.variableValue).toBe("16:45:00");
    expect(wrapper.get(".typing-input").element.value).toBe("16:45");
    expect(document.activeElement).toBe(wrapper.get(".typing-input").element);
    await wrapper.get(".typing-clock").trigger("click");
    await flushPromises();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flushPromises();
    expect(wrapper.vm.pickerOpen).toBe(false);
    expect(document.activeElement).toBe(wrapper.get(".typing-input").element);
  });
});
