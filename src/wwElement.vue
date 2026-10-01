<template>
  <div class="ww-typable-date-picker">
    <div v-if="canType" class="native-field" :class="{ 'native-invalid': !inputValid || content.inputErrorMessage }" :style="typingStyle">
      <label :for="inputId" class="native-label">{{ content.inputLabel || (content.dateMode === 'date' ? 'Date' : 'Time') }}<span v-if="content.required" class="native-required" aria-hidden="true"> *</span></label>
      <input ref="nativeInput" :id="inputId" class="native-control"
        :type="content.dateMode" :step="content.dateMode === 'time' ? 60 : 1"
        :min="content.dateMode === 'date' ? nativeInputValue(content.minDate, 'date') || undefined : undefined"
        :max="content.dateMode === 'date' ? nativeInputValue(content.maxDate, 'date') || undefined : undefined"
        :lang="locale" :readonly="isReadOnly || isEditing" :required="content.required"
        :aria-invalid="!inputValid || !!content.inputErrorMessage" :aria-describedby="!inputValid || content.inputErrorMessage ? `${inputId}-error` : undefined"
        @pointerdown="nativeKeyboardEdit = false" @input="handleNativeInput" @change="handleNativeChange" @keydown="handleNativeKeydown" @keyup="refreshNativeInput" @blur="commitInput" />
      <span v-if="!inputValid || content.inputErrorMessage" :id="`${inputId}-error`" class="native-error">{{ content.inputErrorMessage || nativeError }}</span>
    </div>
    <DatePicker v-else
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
      @open="handlePickerOpen"
      @closed="handlePickerClosed"
      :key="dpKey"
    >
      <template #dp-input="{ value }">
        <wwLayoutItemContext :index="0" :item="null" :data="{ preview: value, value: formatOutputValue(formatedValue) }" is-repeat>
          <wwLayout path="triggerZone" />
        </wwLayoutItemContext>
      </template>
      <template #action-select>
        <wwElement v-bind="content.actionSelectElement" @click="selectDate" />
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
import { nativeInputValue, nativeInputCandidate } from "./nativeInput.js";

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
  data() { return { nativeKeyboardEdit: false }; },
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
      uid: props.uid, name: "inputText", type: "string", defaultValue: nativeInputValue(variableValue.value, props.content.dateMode), readonly: true,
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
      inputText, setInputText, inputValid, setInputValid, hasUncommittedInput, setHasUncommittedInput, nativeInputValue,
    };
  },
  mounted() { this.resetInput(); },
  watch: {
    variableValue(newValue, oldValue) {
      // An autosave may echo an equivalent ISO/time value while a new edit is in progress.
      if (this.canType && this.hasUncommittedInput &&
          nativeInputValue(newValue, this.content.dateMode) === nativeInputValue(oldValue, this.content.dateMode)) return;
      this.resetInput();
    },
    canType() { this.resetInput(); },
    "content.dateMode"() { this.resetInput(); },
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
    async dpKey() {
      if (this.canType || this.content.enableCalendarOnly) return;
      await this.$nextTick();
      this.wwDatePicker.openMenu();
    },
    "wwEditorState.isSelected"(value) {
      if (this.canType || !this.isEditing || !value || this.content.enableCalendarOnly) return;
      this.wwDatePicker.openMenu();
    },
    /* wwEditor:end */
    isReadOnly: {
      immediate: true,
      handler(value) {
        if (value) {
          this.$emit("add-state", "readonly");
        } else {
          this.$emit("remove-state", "readonly");
        }
      },
    },
  },
  computed: {
    canType() {
      return Boolean(this.content.allowTyping && ["date", "time"].includes(this.content.dateMode) &&
        this.content.selectionMode === "single" && (this.content.dateMode === "date" || !this.content.enableSeconds) && !this.content.enableCalendarOnly);
    },
    inputId() { return `typable-date-time-${this.uid}`; },
    nativeError() { return `Enter a complete, valid ${this.content.dateMode === "date" ? "date" : "time"}.`; },
    typingStyle() {
      return {
        "--typing-font": this.content.themeFontFamily || "inherit",
        "--typing-size": this.content.themeFontSize || "14px",
        "--typing-text": this.content.themeTextColor || "#1A2C2B",
        "--typing-background": this.content.themeBackgroundColor || "#FFFFFF",
        "--typing-border": this.content.themeBorderColor || "#D4DFDE",
        "--typing-radius": this.content.themeBorderRadius || "6px",
        "--typing-focus": this.content.inputFocusColor || "#5C7574",
        "--typing-danger": this.content.themeDangerColor || "#b42318",
        "--typing-height": this.content.inputHeight || "40px",
        "--typing-label": this.content.inputLabelColor || "#4C6D6B",
        "--typing-label-size": this.content.inputLabelFontSize || "9px",
        "--typing-label-background": this.content.inputLabelBackgroundColor || this.content.themeBackgroundColor || "#FFFFFF",
        "--typing-required": this.content.inputRequiredColor || "#966844",
        "--typing-error-background": this.content.inputErrorBackgroundColor || "#FFFAF7",
        "--typing-shadow": this.content.inputShadow || "none",
        "--typing-border-width": this.content.inputBorderWidth || "1px",
        "--typing-focus-width": this.content.inputFocusWidth || "2px",
        "--typing-focus-offset": this.content.inputFocusOffset || "2px",
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
      const format =
        this.content.format === "custom"
          ? this.content.customFormat
          : this.content.format;
      if (!format) return null;
      return format.replace(/Y/g, "y").replace(/D/g, "d").replace(/A/g, "a");
    },
    formatedValue() {
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
      const candidate = this.canType && this.$refs.nativeInput && !this.isReadOnly && !this.isEditing
        ? nativeInputCandidate(this.$refs.nativeInput, this.content.dateMode, this.content) : null;
      return {
        valid: candidate ? candidate.valid : !this.canType || this.inputValid,
        text: candidate ? candidate.text : this.canType ? this.inputText : nativeInputValue(this.variableValue, this.content.dateMode),
        value: this.variableValue,
        hasUncommittedInput: Boolean(this.canType && (this.hasUncommittedInput || candidate?.incomplete || (candidate && candidate.text !== nativeInputValue(this.variableValue, this.content.dateMode)))),
        incomplete: candidate?.incomplete || false,
      };
    },
    resetInput() {
      this.nativeKeyboardEdit = false;
      this.setInputText(nativeInputValue(this.variableValue, this.content.dateMode));
      this.setInputValid(true);
      this.setHasUncommittedInput(false);
      this.$nextTick(() => {
        const input = this.$refs.nativeInput;
        if (input) {
          // No reactive value binding: browsers keep partially edited native
          // segments outside .value, and rerenders must not erase those edits.
          if (input.value !== this.inputText || input.validity.badInput) input.value = this.inputText;
          this.setInputValid(nativeInputCandidate(input, this.content.dateMode, this.content).valid);
        }
        this.updateInputValidity();
      });
    },
    updateInputValidity() {
      this.$refs.nativeInput?.setCustomValidity(this.inputValid ? "" : this.nativeError);
      this.$emit(this.inputValid ? "remove-state" : "add-state", "invalid");
    },
    handleNativeInput(event) {
      if (event?.inputType === "insertFromPaste") this.nativeKeyboardEdit = true;
      if (this.isReadOnly || this.isEditing) return;
      const candidate = nativeInputCandidate(this.$refs.nativeInput, this.content.dateMode, this.content);
      this.setInputText(candidate.text);
      this.setInputValid(candidate.valid);
      this.setHasUncommittedInput(true);
      this.updateInputValidity();
      this.$emit("trigger-event", { name: "input", event: this.getInputState() });
    },
    handleNativeChange() {
      // Native date controls may fire change for each year digit. Keyboard edits
      // wait for Enter/Tab/blur; picker confirmations commit immediately.
      if (!this.nativeKeyboardEdit) return this.commitInput();
    },
    refreshNativeInput() {
      if (this.isReadOnly || this.isEditing) return;
      const candidate = nativeInputCandidate(this.$refs.nativeInput, this.content.dateMode, this.content);
      // Some browsers do not emit input while only incomplete segments change:
      // .value stays empty, but badInput changes. Navigation alone is not an edit.
      if (candidate.text !== this.inputText || candidate.valid !== this.inputValid ||
          (candidate.incomplete && !this.hasUncommittedInput)) this.handleNativeInput();
    },
    async commitInput() {
      if (!this.canType || this.isReadOnly || this.isEditing || !this.$refs.nativeInput) return this.getInputState();
      const candidate = nativeInputCandidate(this.$refs.nativeInput, this.content.dateMode, this.content);
      this.setInputValid(candidate.valid);
      this.updateInputValidity();
      if (!candidate.valid) {
        this.setHasUncommittedInput(true);
        return this.getInputState();
      }
      if (this.getInputState().hasUncommittedInput) this.handleSelection(candidate.value);
      return this.getInputState();
    },
    handleNativeKeydown(event) {
      if (event.key === "Enter") {
        event.preventDefault(); event.stopPropagation();
        this.commitInput();
      } else if (event.key === "Tab") this.commitInput();
      else if (event.altKey && event.key === "ArrowDown") this.nativeKeyboardEdit = false;
      else if (/^[0-9ap]$/i.test(event.key) || ["Backspace", "Delete", "ArrowUp", "ArrowDown"].includes(event.key)) this.nativeKeyboardEdit = true;
      // Escape, arrows, segment selection, and separators remain native.
    },
    handlePickerOpen() { this.$emit("trigger-event", { name: "open", event: {} }); },
    handlePickerClosed() { this.$emit("trigger-event", { name: "close", event: {} }); },
    handleSelection(value) {
      if (this.canType) {
        this.nativeKeyboardEdit = false;
        this.setInputText(nativeInputValue(value, this.content.dateMode));
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
      if (!this.canType) { this.wwDatePicker.openMenu(); return; }
      if (this.isReadOnly || this.isEditing) return;
      this.nativeKeyboardEdit = false;
      this.$refs.nativeInput?.focus();
      try { this.$refs.nativeInput?.showPicker?.(); }
      catch { /* Native indicator remains usable when showPicker is restricted. */ }
    },
    closeMenu() {
      if (this.canType) { this.$refs.nativeInput?.blur(); return; }
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
.native-field { position: relative; width: 100%; padding-top: 5px; font-family: var(--typing-font); font-size: var(--typing-size); color: var(--typing-text); }
.native-label { position: absolute; z-index: 1; top: -1px; left: 7px; padding: 0 4px; max-width: calc(100% - 18px); background: var(--typing-label-background); color: var(--typing-label); font-size: var(--typing-label-size); line-height: 12px; }
.native-required { color: var(--typing-required); }
.native-control { display: block; width: 100%; min-width: 0; min-height: var(--typing-height); box-sizing: border-box; padding: 10px 11px 8px; border: var(--typing-border-width) solid var(--typing-border); border-radius: var(--typing-radius); background: var(--typing-background); color: var(--typing-text); box-shadow: var(--typing-shadow); font: inherit; line-height: 1.4; color-scheme: light; }
.native-control:focus-visible { outline: var(--typing-focus-width) solid var(--typing-focus); outline-offset: var(--typing-focus-offset); }
.native-control::-webkit-calendar-picker-indicator { opacity: 1; cursor: pointer; }
.native-control:read-only::-webkit-calendar-picker-indicator { cursor: default; }
.native-invalid .native-control { border-color: var(--typing-danger); background: var(--typing-error-background); }
.native-error { display: block; margin-top: 6px; color: var(--typing-danger); font-size: var(--typing-label-size); line-height: 1.5; }
@media (forced-colors: active) { .native-control:focus-visible { outline: 2px solid Highlight; } .native-invalid .native-control { border-color: Mark; } }
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
