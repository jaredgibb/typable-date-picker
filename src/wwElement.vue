<template>
  <div class="ww-typable-date-picker">
    <DatePicker
      ref="wwDatePicker"
      class="ww-date-time-picker"
      :class="[
        { 'calendar-only': content.enableCalendarOnly },
        content.enableCalendarOnly && content.calendarOnlyFit,
      ]"
      :day-names="customDayNames"
      :model-value="formatedValue"
      @update:model-value="handleSelection"
      :format-locale="formatLocale"
      :format="previewFormat"
      :clearable="false"
      :locale="locale"
      :time-picker="content.dateMode === 'time'"
      :month-picker="content.dateMode === 'month'"
      :year-picker="content.dateMode === 'year'"
      :week-picker="content.dateMode === 'week'"
      :range="content.selectionMode === 'range'"
      :multi-dates="content.selectionMode === 'multi'"
      :multi-dates-limit="
        content.multiDatesLimit ? content.multiDatesLimit : null
      "
      :auto-range="content.rangeMode === 'auto' ? content.autoRange : null"
      :partial-range="
        content.enableCalendarOnly && content.rangeMode === 'free'
          ? true
          : content.rangeMode === 'free'
            ? content.enablePartialRange
            : null
      "
      :min-range="content.rangeMode === 'minmax' ? content.minRange : null"
      :max-range="content.rangeMode === 'minmax' ? content.maxRange : null"
      :multi-calendars="
        content.enableMultiCalendars ? content.multiCalendars : false
      "
      :multi-calendars-solo="content.multiCalendarsSolo"
      :inline="content.enableCalendarOnly"
      :vertical="content.orientation === 'vertical'"
      :enable-time-picker="
        content.dateMode === 'datetime' || content.dateMode === 'time'
      "
      :enable-seconds="content.enableSeconds"
      :is-24="content.use24"
      :autoApply="content.autoApply"
      :close-on-auto-apply="content.closeOnAutoApply"
      :flow="content.enableFlow ? content.flowSteps : null"
      @flow-step="handleFlowStep"
      :timezone="timezone"
      :week-numbers="
        content.weekNumbers === 'none' ? null : content.weekNumbers
      "
      :hide-offset-dates="content.hideOffsetDates"
      :min-date="content.minDate"
      :max-date="content.maxDate"
      :prevent-min-max-navigation="content.preventMinMaxNavigation"
      :start-date="content.startDate"
      :week-start="content.weekStart"
      :ignore-time-validation="content.ignoreTimeValidation"
      :disable-month-year-select="content.disableMonthYearSelect"
      :allowed-dates="content.allowedDates"
      :disabled-dates="content.disabledDates"
      :disabled-week-days="content.disabledWeekDays"
      :no-disabled-range="content.noDisabledRange"
      :model-type="modelType"
      :position="content.menuPosition || 'center'"
      :teleport="
        content.enableCalendarOnly || content.stickedDatePicker ? null : body
      "
      :dpStyle="{ ...themeStyle }"
      :readonly="isReadOnly || isEditing"
      :text-input="canType"
      :text-input-options="typingOptions"
      @open="handlePickerOpen"
      @closed="handlePickerClosed"
      @invalid-select="handleInvalidSelection"
      :key="dpKey"
    >
      <template #dp-input="slot">
        <div v-if="canType" class="typing-field" :class="{ 'typing-invalid': !inputValid, 'typing-picker-open': pickerOpen }" :style="typingStyle">
          <label :for="inputId" :class="{ 'typing-sr-only': !content.inputLabel }">{{ content.inputLabel || 'Time' }}</label>
          <div class="typing-control" @click.stop>
            <input
              ref="typingInput"
              :id="inputId"
              class="typing-input"
              type="text"
              inputmode="text"
              autocomplete="off"
              spellcheck="false"
              :value="inputText"
              :placeholder="content.inputPlaceholder || 'HH:mm'"
              :readonly="isReadOnly || isEditing"
              :required="content.required"
              :aria-invalid="!inputValid"
              :aria-describedby="!inputValid ? `${inputId}-error` : undefined"
              @input="handleTypedInput($event, slot)"
              @keydown="handleTypingKeydown($event, slot)"
              @blur="handleTypingBlur($event, slot)"
            />
            <button
              type="button"
              class="typing-clock"
              :aria-label="content.clockButtonLabel || 'Open time picker'"
              aria-haspopup="dialog"
              :aria-expanded="pickerOpen"
              :disabled="isReadOnly || isEditing"
              @mousedown.prevent
              @click.stop="toggleTypingPicker"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <span v-if="!inputValid" :id="`${inputId}-error`" class="typing-sr-only">Enter a time from 00:00 to 23:59 in HH:mm format.</span>
        </div>
        <wwLayoutItemContext
          v-else
          :index="0"
          :item="null"
          :data="{ preview: slot.value, value: formatOutputValue(formatedValue) }"
          is-repeat
        >
          <wwLayout path="triggerZone" />
        </wwLayoutItemContext>
      </template>
      <template #action-select>
        <button v-if="canType" type="button" class="typing-select" :style="typingStyle" @click="confirmPickerSelection">Select time</button>
        <wwElement v-else v-bind="content.actionSelectElement" @click="selectDate" />
      </template>
      <template #left-sidebar v-if="content.enableLeftSidebar">
        <wwLayout path="leftSidebarZone" />
      </template>
      <template #right-sidebar v-if="content.enableRightSidebar">
        <wwLayout path="rightSidebarZone" />
      </template>
    </DatePicker>
    <input
      v-if="!canType"
      class="required-handler"
      type="text"
      :required="content.required"
      :value="formatedValue"
      tabindex="-1"
      aria-hidden="true"
    />
  </div>
</template>

<script>
import DatePicker from "./vue-datepicker.js";
import * as DateFnsLocal from "date-fns/locale";
import "./main.css";
import { computed, ref, inject } from "vue";
import { parseTimeText, timeTextFromValue, parseLibraryInput } from "./timeInput.js";

export default {
  components: {
    DatePicker,
  },
  emits: ["update:content", "add-state", "remove-state", "trigger-event"],
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
    wwElementState: { type: Object, required: true },
  },
  setup(props, { emit }) {
    const initValue = computed(() =>
      props.content.selectionMode === "single"
        ? props.content.initValueSingle || null
        : props.content.selectionMode === "range"
          ? {
              start: props.content.initValueRangeStart || null,
              end: props.content.initValueRangeEnd || null,
            }
          : Array.isArray(props.content.initValueMulti)
            ? props.content.initValueMulti
            : [],
    );
    const { value: variableValue, setValue } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "value",
        defaultValue: initValue,
      });
    const { value: inputText, setValue: setInputText } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid, name: "inputText", type: "string", defaultValue: timeTextFromValue(variableValue.value), readonly: true,
    });
    const { value: inputValid, setValue: setInputValid } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid, name: "inputValid", type: "boolean", defaultValue: true, readonly: true,
    });
    const { value: hasUncommittedInput, setValue: setHasUncommittedInput } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid, name: "hasUncommittedInput", type: "boolean", defaultValue: false, readonly: true,
    });

    const body = wwLib.getFrontDocument().body;

    const wwDatePicker = ref(null);
    const selectDate = () => {
      wwDatePicker.value.selectDate();
    };

    const useForm = inject("_wwForm:useForm", () => {});

    const fieldName = computed(() => props.content.fieldName);
    const validation = computed(() => props.content.validation);
    const customValidation = computed(() => props.content.customValidation);
    const required = computed(() => props.content.required);

    useForm(
      variableValue,
      {
        fieldName,
        validation,
        customValidation,
        required,
        initialValue: computed(() => props.content.value),
      },
      {
        elementState: props.wwElementState,
        emit,
        sidepanelFormPath: "form",
        setValue,
      },
    );

    return {
      variableValue,
      setValue,
      body,
      initValue,
      wwDatePicker,
      selectDate,
      inputText, setInputText, inputValid, setInputValid, hasUncommittedInput, setHasUncommittedInput,
    };
  },
  data() {
    return { pickerOpen: false, focusAfterClose: false, inputRevision: 0, inputHandlers: null, pendingCommit: null };
  },
  mounted() {
    wwLib.getFrontDocument().addEventListener("keydown", this.handlePickerEscape, true);
  },
  beforeUnmount() {
    wwLib.getFrontDocument().removeEventListener("keydown", this.handlePickerEscape, true);
  },
  watch: {
    variableValue(newValue, oldValue) {
      // An autosave may echo an equivalent ISO/time value while a new edit is in progress.
      if (this.canType && this.hasUncommittedInput &&
          timeTextFromValue(newValue) === timeTextFromValue(oldValue)) return;
      this.resetInput();
    },
    canType() { this.resetInput(); },
    inputValid() { this.updateInputValidity(); },
    initValue(newValue, oldValue) {
      if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;
      this.setValue(newValue);
      this.$emit("trigger-event", {
        name: "initValueChange",
        event: { value: newValue },
      });
    },
    /* wwEditor:start */
    "content.selectionMode"(value) {
      this.setValue(null);
      if (
        value === "multi" &&
        !["datetime", "date"].includes(this.content.dateMode)
      )
        this.$emit("update:content:effect", { dateMode: "datetime" });
      this.setValue(this.initialValue);
    },
    "content.dateMode"() {
      this.setValue(this.initialValue);
    },
    async dpKey() {
      if (this.content.enableCalendarOnly) return;
      await this.$nextTick();
      this.wwDatePicker.openMenu();
    },
    "wwEditorState.isSelected"(value) {
      if (!this.isEditing || !value || this.content.enableCalendarOnly) return;
      this.wwDatePicker.openMenu();
    },
    /* wwEditor:end */
    isReadOnly: {
      immediate: true,
      handler(value) {
        if (value) {
          this.$emit("add-state", "readonly");
          if (this.canType && this.pickerOpen) this.wwDatePicker?.closeMenu();
        } else {
          this.$emit("remove-state", "readonly");
        }
      },
    },
  },
  computed: {
    canType() {
      return Boolean(this.content.allowTyping && this.content.dateMode === "time" &&
        this.content.selectionMode === "single" && this.content.use24 &&
        !this.content.enableSeconds && !this.content.enableCalendarOnly);
    },
    inputId() { return `typable-time-${this.uid}`; },
    typingOptions() {
      return { openMenu: false, enterSubmit: true, tabSubmit: true, format: parseLibraryInput };
    },
    typingStyle() {
      return {
        "--typing-font": this.content.themeFontFamily || "inherit",
        "--typing-size": this.content.themeFontSize || "14px",
        "--typing-text": this.content.themeTextColor || "#1A2C2B",
        "--typing-background": this.content.themeBackgroundColor || "#FFFFFF",
        "--typing-border": this.content.themeBorderColor || "#D4DFDE",
        "--typing-radius": this.content.themeBorderRadius || "6px",
        "--typing-focus": this.content.inputFocusColor || "#D4DFDE",
        "--typing-danger": this.content.themeDangerColor || "#b42318",
        "--typing-primary": this.content.themePrimaryColor || "#253F3E",
        "--typing-primary-text": this.content.themePrimaryTextColor || "#FFFFFF",
        "--typing-height": this.content.inputHeight || "40px",
      };
    },
    isEditing() {
      /* wwEditor:start */
      return (
        this.wwEditorState.editMode === wwLib.wwEditorHelper.EDIT_MODES.EDITION
      );
      /* wwEditor:end */
      // eslint-disable-next-line no-unreachable
      return false;
    },
    /* https://github.com/date-fns/date-fns/blob/main/docs/unicodeTokens.md */
    previewFormat() {
      if (this.canType) return "HH:mm";
      const format =
        this.content.format === "custom"
          ? this.content.customFormat
          : this.content.format;
      if (!format) return null;
      return format.replace(/Y/g, "y").replace(/D/g, "d").replace(/A/g, "a");
    },
    formatedValue() {
      if (this.canType) {
        const text = timeTextFromValue(this.variableValue);
        return text ? `${text}:00` : null;
      }
      return this.formatInputValue(this.variableValue);
    },
    locale() {
      if (this.content.lang === "pageLang") {
        return wwLib.wwLang.lang;
      }

      return this.content.lang;
    },
    formatLocale() {
      try {
        return DateFnsLocal[this.locale];
      } catch (e) {
        return "en";
      }
    },
    timezone() {
      if (!this.content.timezone || this.content.timezone === "locale")
        return null;
      return this.content.timezone;
    },
    dpKey() {
      return (
        this.content.selectionMode +
        "-" +
        this.content.dateMode +
        "-" +
        (this.content.menuPosition || "center") +
        (this.content.enableCalendarOnly ? "-only" : "") +
        (this.content.enableRightSidebar ? "-rightside" : "") +
        (this.content.enableLeftSidebar ? "-leftside" : "")
      );
    },
    modelType() {
      if (this.content.dateMode === "date") return "yyyy-MM-dd";
      if (this.content.dateMode === "time") return "HH:mm:SS";
      if (this.content.dateMode === "month") return "yyyy-MM";
      return null;
    },
    isReadOnly() {
      /* wwEditor:start */
      if (this.wwEditorState.isSelected) {
        return this.wwElementState.states?.includes("readonly");
      }
      /* wwEditor:end */
      return this.wwElementState.props?.readonly === undefined
        ? this.content.readonly
        : this.wwElementState.props?.readonly;
    },
    customDayNames() {
      if (this.locale == "ar") {
        /*
                    Sun - أحد (Ahad)
                    Mon - إثن (Ithn)
                    Tue - ثلاث (Thulath)
                    Wed - أربع (Arba')
                    Thu - خمس (Khams)
                    Fri - جمعة (Jumu'ah)
                    Sat - سبت (Sabt)
                */
        const arDayList = ["أحد", "إثن", "ثلاث", "أربع", "خمس", "جمعة", "سبت"];
        const weekStartIndex = this.content.weekStart; // 0 to 6
        return arDayList
          .slice(weekStartIndex)
          .concat(arDayList.slice(0, weekStartIndex));
      }
      return null;
    },
    themeStyle() {
      return {
        // COLORS
        "--dp-background-color": this.content.themeBackgroundColor,
        "--dp-text-color": this.content.themeTextColor,
        "--dp-hover-color": this.content.themeHoverColor,
        "--dp-hover-text-color": this.content.themeHoverTextColor,
        "--dp-hover-icon-color": this.content.themeHoverIconColor,
        "--dp-primary-color": this.content.themePrimaryColor,
        "--dp-primary-text-color": this.content.themePrimaryTextColor,
        "--dp-secondary-color": this.content.themeSecondaryColor,
        "--dp-border-color": this.content.themeBorderColor,
        "--dp-menu-border-color": this.content.themeMenuBorderColor,
        "--dp-border-color-hover": this.content.themeBorderHoverColor,
        "--dp-disabled-color": this.content.themeDisabledColor,
        "--dp-scroll-bar-background":
          this.content.themeScrollBarBackgroundColor,
        "--dp-scroll-bar-color": this.content.themeMScrollBarColor,
        "--dp-success-color": this.content.themeSuccessColor,
        "--dp-success-color-disabled": this.content.themeSuccessDisabledColor,
        "--dp-icon-color": this.content.themeIconColor,
        "--dp-danger-color": this.content.themeDangerColor,
        "--dp-highlight-color": this.content.themeHighlightColor,
        // GENERAL
        "--dp-font-family": this.content.themeFontFamily || "unset",
        "--dp-border-radius": this.content.themeBorderRadius,
        "--dp-cell-border-radius": this.content.themeCellBorderRadius,
        "--dp-font-size": this.content.themeFontSize,
        "--dp-preview-font-size": this.content.themePreviewFontSize,
        "--dp-time-font-size": this.content.themeTimeFontSize,
        "--dp-cell-size": this.content.themeCellSize,
        "--dp-cell-padding": this.content.themeCellPadding,
        "--dp-menu-min-width": this.content.themeMenuMinWidth,
      };
    },
  },
  methods: {
    getInputState() {
      return {
        valid: !this.canType || this.inputValid,
        text: this.canType ? this.inputText : timeTextFromValue(this.variableValue),
        value: this.variableValue,
        hasUncommittedInput: this.canType && this.hasUncommittedInput,
      };
    },
    resetInput() {
      this.inputRevision++;
      this.setInputText(timeTextFromValue(this.variableValue));
      this.setInputValid(true);
      this.setHasUncommittedInput(false);
      this.$nextTick(() => this.updateInputValidity());
    },
    updateInputValidity() {
      this.$refs.typingInput?.setCustomValidity(this.inputValid ? "" : "Enter a time from 00:00 to 23:59 in HH:mm format.");
      this.$emit(this.inputValid ? "remove-state" : "add-state", "invalid");
    },
    handleTypedInput(event, handlers) {
      if (this.isReadOnly || this.isEditing) return;
      this.inputHandlers = handlers;
      this.inputRevision++;
      this.setInputText(event.target.value);
      this.setInputValid(parseTimeText(event.target.value).valid);
      this.setHasUncommittedInput(true);
      // Strict parser prevents the library from interpreting partial/invalid text.
      handlers.onInput(event);
      this.updateInputValidity();
      this.$emit("trigger-event", { name: "input", event: this.getInputState() });
    },
    async commitInput(reason = "enter", handlers = this.inputHandlers) {
      if (!this.canType || this.isReadOnly || this.isEditing || !this.hasUncommittedInput) return this.getInputState();
      const parsed = parseTimeText(this.inputText);
      this.setInputValid(parsed.valid);
      this.updateInputValidity();
      if (!parsed.valid || !handlers) return this.getInputState();
      if (this.pendingCommit?.revision === this.inputRevision) return this.pendingCommit.promise;
      const revision = this.inputRevision;
      const promise = (async () => {
        // Reparse on each commit: library confirmation consumes its parsed candidate.
        handlers.onInput({ target: { value: this.inputText } });
        await this.$nextTick();
        if (revision !== this.inputRevision) return this.getInputState();
        if (parsed.empty) handlers.onClear();
        else if (reason === "tab") handlers.onTab();
        else handlers.onEnter();
        await this.$nextTick();
        return this.getInputState();
      })();
      this.pendingCommit = { revision, promise };
      try { return await promise; }
      finally { if (this.pendingCommit?.revision === revision) this.pendingCommit = null; }
    },
    handleTypingKeydown(event, handlers) {
      if (event.key === "Enter") {
        event.preventDefault(); event.stopPropagation();
        this.commitInput("enter", handlers);
      } else if (event.key === "Tab") {
        this.commitInput("tab", handlers);
      } else if (event.key === "Escape" && this.pickerOpen) {
        event.preventDefault(); event.stopPropagation();
        this.focusAfterClose = true;
        this.wwDatePicker.closeMenu();
      }
    },
    handlePickerEscape(event) {
      if (!this.canType || !this.pickerOpen || event.key !== "Escape") return;
      event.preventDefault(); event.stopPropagation();
      this.focusAfterClose = true;
      this.wwDatePicker.closeMenu();
    },
    handleTypingBlur(event, handlers) {
      if (this.pickerOpen || this.$el.contains(event.relatedTarget)) return;
      this.commitInput("blur", handlers);
    },
    toggleTypingPicker() {
      if (this.isReadOnly || this.isEditing) return;
      if (this.pickerOpen) {
        this.focusAfterClose = true;
        this.wwDatePicker.closeMenu();
      } else this.wwDatePicker.openMenu();
    },
    handlePickerOpen() {
      this.pickerOpen = true;
      if (this.canType) {
        // Opening reparses the committed model in the library. Seed its panel
        // with valid pending text so switching paths does not lose that edit.
        if (this.hasUncommittedInput) {
          const candidate = parseLibraryInput(this.inputText);
          if (candidate) this.wwDatePicker.updateInternalModelValue(candidate);
        }
        this.$emit("trigger-event", { name: "open", event: {} });
      }
    },
    handlePickerClosed() {
      this.pickerOpen = false;
      if (!this.canType) return;
      if (this.focusAfterClose) this.$nextTick(() => this.$refs.typingInput?.focus());
      else if (this.hasUncommittedInput) this.commitInput("blur");
      this.focusAfterClose = false;
      this.$emit("trigger-event", { name: "close", event: {} });
    },
    confirmPickerSelection() {
      this.focusAfterClose = this.canType;
      this.selectDate();
    },
    handleInvalidSelection() {
      if (!this.canType) return;
      this.setInputValid(false);
      this.updateInputValidity();
      this.focusAfterClose = false;
    },
    handleSelection(value) {
      if (this.canType) {
        this.inputRevision++;
        this.setInputText(timeTextFromValue(value));
        this.setInputValid(true);
        this.setHasUncommittedInput(false);
        this.updateInputValidity();
      }
      if (this.content.dateMode === "datetime" && value) {
        value = Array.isArray(value)
          ? value.map((date) => (date ? date.toISOString() : null))
          : value.toISOString();
      }
      const newValue = this.formatOutputValue(value);
      if (JSON.stringify(this.variableValue) === JSON.stringify(newValue))
        return;
      this.setValue(newValue);
      this.$emit("trigger-event", {
        name: "change",
        event: { value: newValue },
      });
    },
    formatInputValue(value) {
      if (!value) return null;
      else if (this.content.selectionMode === "single") return value;
      else if (this.content.selectionMode === "range") {
        if (!value.start && !value.end) return null;
        return [value.start || null, value.end || null].filter(
          (value) => value !== null && value !== "",
        );
      } else if (this.content.selectionMode === "multi") return value;
    },
    formatOutputValue(value) {
      if (!value) return null;
      else if (this.content.selectionMode === "single") return value;
      else if (this.content.selectionMode === "range")
        return { start: value[0], end: value[1] };
      else if (this.content.selectionMode === "multi") return value;
    },
    clearValue() {
      const clearValue =
        this.content.selectionMode === "single"
          ? null
          : this.content.selectionMode === "range"
            ? {
                start: null,
                end: null,
              }
            : [];
      this.setValue(clearValue);
      this.resetInput();
    },
    handleFlowStep(value) {
      this.$emit("trigger-event", {
        name: "onFlowStep",
        event: { value: value },
      });
    },
    openMenu() {
      this.wwDatePicker.openMenu();
    },
    closeMenu() {
      this.$nextTick(() => {
        this.wwDatePicker.closeMenu();
      });
    },
    /* wwEditor:start */
    getTestEvent() {
      let fakeDate = new Date().toISOString();
      if (this.content.dateMode === "month") fakeDate = "2023-03";
      if (this.content.dateMode === "year") fakeDate = "2023";
      if (this.content.dateMode === "time") fakeDate = "01:25:00";
      if (this.content.selectionMode === "single") return { value: fakeDate };
      else if (this.content.selectionMode === "range")
        return { value: { start: fakeDate, end: fakeDate } };
      else if (this.content.selectionMode === "multi")
        return { value: [fakeDate, fakeDate, fakeDate] };
    },
    /* wwEditor:end */
  },
};
</script>

<style>
.dp__action_row {
  width: 100% !important;
}
</style>

<style scoped>
.typing-field { width: 100%; font-family: var(--typing-font); font-size: var(--typing-size); color: var(--typing-text); }
.typing-field label:not(.typing-sr-only) { display: block; margin-bottom: 6px; }
.typing-control { display: flex; align-items: stretch; width: 100%; min-height: var(--typing-height); box-sizing: border-box; border: 1px solid var(--typing-border); border-radius: var(--typing-radius); background: var(--typing-background); }
.typing-control:focus-within, .typing-picker-open .typing-control { box-shadow: inset 0 0 0 3px var(--typing-focus); }
.typing-invalid .typing-control { border-color: var(--typing-danger); }
.typing-input { flex: 1; min-width: 0; width: 100%; padding: 8px 12px; border: 0; outline: none; border-radius: inherit; background: transparent; font: inherit; color: inherit; }
.typing-input::placeholder { color: #8FA9A8; opacity: 1; }
.typing-clock { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 40px; border: 0; border-radius: inherit; background: transparent; color: inherit; cursor: pointer; }
.typing-clock:focus-visible { outline: 2px solid currentColor; outline-offset: -5px; }
.typing-clock:disabled { cursor: default; opacity: .5; }
.typing-select { min-height: 32px; padding: 6px 12px; border: 0; border-radius: var(--typing-radius); background: var(--typing-primary); color: var(--typing-primary-text); font-family: var(--typing-font); font-size: var(--typing-size); cursor: pointer; }
.typing-select:focus-visible { outline: 2px solid var(--typing-primary); outline-offset: 2px; }
.typing-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (forced-colors: active) { .typing-control:focus-within { outline: 2px solid Highlight; } .typing-invalid .typing-control { border-color: Mark; } }
</style>

<style lang="scss" scoped>
:deep(.calendar-only.stretch) .dp__outer_menu_wrap {
  width: 100% !important;
}

:deep(.dp__action_buttons) {
  display: flex;
  justify-content: flex-end;
}

.calendar-only.center {
  justify-content: center;
}
.required-handler {
  opacity: 0;
  width: 100%;
  height: 0;
  position: absolute;
  pointer-events: none;
}
</style>
