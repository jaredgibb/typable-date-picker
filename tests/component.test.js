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

async function edit(wrapper, text) {
  wrapper.get(".native-control").element.value = text;
  await wrapper.get(".native-control").trigger("input");
}
function partial(wrapper) {
  const input = wrapper.get(".native-control").element;
  input.value = "";
  Object.defineProperty(input, "validity", { configurable: true, get: () => ({ badInput: true }) });
  return input;
}

describe("native controls and legacy fallback", () => {
  it("defaults typing off and retains the real library trigger", () => {
    expect(config.properties.allowTyping.defaultValue).toBe(false);
    const wrapper = create({ allowTyping: false });
    expect(wrapper.find(".native-control").exists()).toBe(false);
    expect(wrapper.text()).toContain("Legacy trigger");
    wrapper.vm.handleSelection("14:30:00");
    expect(wrapper.vm.variableValue).toBe("14:30:00");
  });
  it.each([{ dateMode: "datetime" }, { selectionMode: "range" }, { enableSeconds: true }, { enableCalendarOnly: true }])("preserves the library for unsupported configurations %j", override => {
    expect(create(override).find(".native-control").exists()).toBe(false);
  });
  it("uses native time with step=60 even when the library 24-hour setting is off", async () => {
    const wrapper = create({ use24: false });
    await nextTick();
    expect(wrapper.get(".native-control").attributes("type")).toBe("time");
    expect(wrapper.get(".native-control").attributes("step")).toBe("60");
    await edit(wrapper, "21:34");
    expect((await wrapper.vm.commitInput()).value).toBe("21:34:00");
  });
  it("provides native dates with canonical YYYY-MM-DD and constraints", async () => {
    const wrapper = create({ dateMode: "date", minDate: "2026-09-01", maxDate: "2026-12-31" });
    await nextTick();
    expect(wrapper.get(".native-control").attributes()).toMatchObject({ type: "date", min: "2026-09-01", max: "2026-12-31" });
    await edit(wrapper, "2026-10-01");
    expect((await wrapper.vm.commitInput()).value).toBe("2026-10-01");
    await edit(wrapper, "2027-01-01");
    expect((await wrapper.vm.commitInput()).valid).toBe(false);
    expect(wrapper.vm.variableValue).toBe("2026-10-01");
  });
  it("retains valid pending input, prevents Enter submission and commits once", async () => {
    const wrapper = create();
    await edit(wrapper, "14:30");
    expect(wrapper.vm.variableValue).toBe(null);
    expect(wrapper.vm.getInputState().hasUncommittedInput).toBe(true);
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    wrapper.get(".native-control").element.dispatchEvent(event);
    await flushPromises();
    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.vm.variableValue).toBe("14:30:00");
    await wrapper.get(".native-control").trigger("change");
    await wrapper.get(".native-control").trigger("blur");
    expect(changes(wrapper)).toHaveLength(1);
  });
  it("Tab commits midnight without blocking native segment navigation", async () => {
    const wrapper = create();
    await edit(wrapper, "00:00");
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    wrapper.get(".native-control").element.dispatchEvent(event);
    await flushPromises();
    expect(event.defaultPrevented).toBe(false);
    expect(wrapper.vm.variableValue).toBe("00:00:00");
    await wrapper.get(".native-control").trigger("blur");
    expect(changes(wrapper)).toHaveLength(1);
  });
  it.each(["Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Backspace", "Delete"])("leaves %s to the browser", async key => {
    const wrapper = create();
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    wrapper.get(".native-control").element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
  it("captures Save before blur, even before an input event is delivered", async () => {
    const wrapper = create();
    await nextTick();
    wrapper.get(".native-control").element.value = "23:59";
    expect(wrapper.vm.getInputState()).toMatchObject({ valid: true, hasUncommittedInput: true });
    expect(await wrapper.vm.commitInput()).toMatchObject({ valid: true, value: "23:59:00", hasUncommittedInput: false });
    expect(changes(wrapper)).toHaveLength(1);
  });
  it("blocks incomplete segments with empty native value instead of clearing the previous time", async () => {
    const wrapper = create({ initValueSingle: "14:30:00" });
    await flushPromises();
    const input = partial(wrapper);
    await wrapper.get(".native-control").trigger("input");
    expect(await wrapper.vm.commitInput()).toMatchObject({ valid: false, incomplete: true, text: "", value: "14:30:00", hasUncommittedInput: true });
    expect(changes(wrapper)).toHaveLength(0);
    expect(wrapper.get(".native-control").attributes("aria-invalid")).toBe("true");
    expect(wrapper.text()).toContain("Enter a complete, valid time.");
    delete input.validity;
    await edit(wrapper, "16:45");
    expect((await wrapper.vm.commitInput()).valid).toBe(true);
    expect(input.validity.customError).toBe(false);
  });
  it("preserves partially edited browser segments through unrelated rerenders", async () => {
    const wrapper = create({ initValueSingle: "14:30:00" });
    await flushPromises();
    const input = partial(wrapper);
    await wrapper.get(".native-control").trigger("input");
    await wrapper.setProps({ content: { ...wrapper.props("content"), inputLabel: "Updated label", inputErrorMessage: "Host pair error" } });
    expect(input.value).toBe("");
    expect(input.validity.badInput).toBe(true);
    expect(wrapper.vm.variableValue).toBe("14:30:00");
  });
  it("clears to null once and permits blank draft values even when required", async () => {
    const wrapper = create({ initValueSingle: "14:30:00", required: true });
    await flushPromises();
    await edit(wrapper, "");
    expect(await wrapper.vm.commitInput()).toMatchObject({ valid: true, value: null, hasUncommittedInput: false });
    await wrapper.get(".native-control").trigger("blur");
    expect(changes(wrapper)).toHaveLength(1);
    expect(changes(wrapper)[0].event.value).toBe(null);
    expect(wrapper.get(".native-control").element.validity.valueMissing).toBe(true);
  });
  it("hydrates ISO values without change events; reset silently clears both paths", async () => {
    const iso = new Date(2026, 9, 1, 10, 24).toISOString();
    const wrapper = create({ initValueSingle: iso });
    await flushPromises();
    expect(wrapper.get(".native-control").element.value).toBe("10:24");
    expect(wrapper.vm.variableValue).toBe(iso);
    await wrapper.setProps({ content: { ...wrapper.props("content"), initValueSingle: "18:09:00" } });
    await flushPromises();
    expect(wrapper.get(".native-control").element.value).toBe("18:09");
    expect(changes(wrapper)).toHaveLength(0);
    wrapper.vm.clearValue();
    await flushPromises();
    expect(wrapper.get(".native-control").element.value).toBe("");
    expect(wrapper.vm.variableValue).toBe(null);
    expect(changes(wrapper)).toHaveLength(0);
  });
  it("keeps new edits when autosave echoes an equivalent ISO value", async () => {
    const wrapper = create({ initValueSingle: "14:30:00" });
    await flushPromises();
    await edit(wrapper, "16:45");
    await wrapper.setProps({ content: { ...wrapper.props("content"), initValueSingle: new Date(2026, 9, 1, 14, 30).toISOString() } });
    await flushPromises();
    expect(wrapper.get(".native-control").element.value).toBe("16:45");
    expect(wrapper.vm.hasUncommittedInput).toBe(true);
  });
  it("restores the committed value on Cancel, and resets invalid state", async () => {
    const wrapper = create({ initValueSingle: "14:30:00" });
    await flushPromises();
    const input = partial(wrapper);
    await wrapper.get(".native-control").trigger("input");
    delete input.validity;
    wrapper.vm.resetInput();
    await flushPromises();
    expect(input.value).toBe("14:30");
    expect(wrapper.vm.inputValid).toBe(true);
    expect(changes(wrapper)).toHaveLength(0);
  });
  it("keeps labels associated and visible in empty/filled states, with a required marker", async () => {
    const wrapper = create({ inputLabel: "Arrival time", required: true });
    await flushPromises();
    expect(wrapper.get("label").attributes("for")).toBe(wrapper.get(".native-control").attributes("id"));
    expect(wrapper.get(".native-required").text()).toBe("*");
    await edit(wrapper, "21:34");
    expect(wrapper.get("label").text()).toBe("Arrival time *");
    const date = create({ dateMode: "date" });
    expect(date.get("label").text()).toBe("Date");
  });
  it("exposes flexible styles and associated host validation messages", async () => {
    const wrapper = create({ themeFontSize: "12px", inputHeight: "38px", inputBorderWidth: "2px", inputFocusColor: "#123456", inputLabelFontSize: "10px", inputShadow: "none", inputErrorMessage: "Clear must follow Arrival" });
    await flushPromises();
    expect(wrapper.vm.typingStyle).toMatchObject({ "--typing-size": "12px", "--typing-height": "38px", "--typing-border-width": "2px", "--typing-focus": "#123456", "--typing-label-size": "10px", "--typing-shadow": "none" });
    expect(wrapper.get(".native-field").classes()).toContain("native-invalid");
    expect(wrapper.get(".native-control").attributes("aria-describedby")).toBe(wrapper.get(".native-error").attributes("id"));
  });
  it("blocks read-only editing and picker actions", async () => {
    const wrapper = create({ readonly: true, initValueSingle: "14:30:00" });
    await flushPromises();
    const input = wrapper.get(".native-control");
    expect(input.element.readOnly).toBe(true);
    let opens = 0;
    input.element.showPicker = () => opens++;
    wrapper.vm.openMenu();
    await edit(wrapper, "21:34");
    await wrapper.vm.commitInput();
    expect(opens).toBe(0);
    expect(wrapper.vm.variableValue).toBe("14:30:00");
    expect(changes(wrapper)).toHaveLength(0);
  });
  it("opens the native picker when browser activation permits it and tolerates restricted activation", async () => {
    const wrapper = create();
    await flushPromises();
    const input = wrapper.get(".native-control").element;
    let opens = 0;
    input.showPicker = () => opens++;
    wrapper.vm.openMenu();
    expect(opens).toBe(1);
    expect(document.activeElement).toBe(input);
    input.showPicker = () => { throw new DOMException("Requires user activation"); };
    expect(() => wrapper.vm.openMenu()).not.toThrow();
  });
  it("deduplicates input/change/blur from picker selection and rapid edits", async () => {
    const wrapper = create();
    await edit(wrapper, "09:34");
    await wrapper.get(".native-control").trigger("change");
    await wrapper.get(".native-control").trigger("blur");
    await edit(wrapper, "09:35");
    await wrapper.vm.commitInput();
    expect(changes(wrapper).map(event => event.event.value)).toEqual(["09:34:00", "09:35:00"]);
  });
  it("defers year-digit changes until a keyboard commit", async () => {
    const wrapper = create({ dateMode: "date" });
    await flushPromises();
    await wrapper.get(".native-control").trigger("keydown", { key: "2" });
    await edit(wrapper, "0002-10-01");
    await wrapper.get(".native-control").trigger("change");
    await wrapper.get(".native-control").trigger("keydown", { key: "6" });
    await edit(wrapper, "2026-10-01");
    await wrapper.get(".native-control").trigger("change");
    expect(changes(wrapper)).toHaveLength(0);
    await wrapper.get(".native-control").trigger("keydown", { key: "Enter" });
    expect(changes(wrapper).map(event => event.event.value)).toEqual(["2026-10-01"]);
  });
  it("refreshes partial segment validity when the browser has not fired input", async () => {
    const wrapper = create();
    await flushPromises();
    partial(wrapper);
    await wrapper.get(".native-control").trigger("keyup", { key: "9" });
    expect(wrapper.vm.inputValid).toBe(false);
    expect(wrapper.vm.hasUncommittedInput).toBe(true);
  });
  it("does not open a missing library picker when native config changes in the editor", async () => {
    const wrapper = create();
    await wrapper.setProps({ content: { ...wrapper.props("content"), use24: false } });
    await flushPromises();
    expect(wrapper.find(".native-control").exists()).toBe(true);
  });
});
