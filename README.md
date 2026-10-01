# Typable date / time picker for WeWeb

Segmented date/time entry with flexible WeWeb styling and an enforced 24-hour option. Users edit the date or time segments without typing `/` or `:`. Dates and default time mode use browser controls. Enabling **24h mode** uses explicit hour/minute segments and the retained 24-hour library picker. Both paths update the same committed `value` and `change` event.

## Import or update in WeWeb

Use the public repository [jaredgibb/typable-date-picker](https://github.com/jaredgibb/typable-date-picker), branch **main**, release tag **v0.2.1**. Follow WeWeb's [source-code import workflow](https://developer.weweb.io/development-process.html). For an existing import, build/select the updated source version in the WeWeb dashboard, then refresh the editor.

Configure each field:

- Selection: **Single**
- Mode: **Date** or **Time**
- Allow typing: **On**
- 24h mode: **On** for guaranteed `HH:mm` entry and picker display; **Off** for native browser time formatting
- Seconds and inline/calendar-only mode: **Off** for time
- Input label: **Arrival date**, **Arrival time**, **Clear date**, or **Clear time**

**Allow typing defaults to off.** When off, or in datetime/range/multiple/month/year/seconds/inline modes, the original picker and trigger/action slots remain available. Date mode uses `<input type="date">`. Time with 24h mode off uses `<input type="time" step="60">`. Time with 24h mode on uses separately editable hour/minute inputs, a permanent colon, and the existing library's 24-hour popup and **Select time** button. The vendored library remains unchanged.

## Display and keyboard behavior

These native-mode examples match the verified Chromium browser's US display. Native formatting, segment order, icons, popups, and mobile presentation depend on the browser/OS locale. `format` and `customFormat` apply to the library fallback. **24h mode (`use24`) now controls the visible time field and picker** by selecting the explicit 24-hour path, because native HTML has no reliable per-field 12/24-hour display override. Native time values remain 24-hour even when the field displays AM/PM. See [native date values](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date) and [native time values](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time).

| State | Date display | Time display |
| --- | --- | --- |
| Empty | `mm/dd/yyyy` | `--:-- --` |
| Partial | `10/01/yyyy` | `09:-- --` |
| Complete | `10/01/2026` | `09:34 PM` |

With **24h mode on**, empty time is `--:--`, a partial value can be `14:--`, and a complete value is `14:30` or `21:34`. There is no AM/PM segment in either the field or popup. Typing `1430` fills hours then minutes without a colon; typing `9` completes `09` and advances to minutes. Valid single-digit segments are zero-padded on explicit commit; invalid `25:30`, `14:75`, and missing segments remain visibly invalid. Arrow keys navigate/adjust segments, Tab advances normally, and Backspace/Delete clears a segment. Pasting `14:30` or `1430` into either segment fills the pair.

The native control provides separately editable month/day/year or hour/minute/AM–PM segments, selected-segment highlighting, digit replacement, automatic advancement, and separators. In the verified browser, typing `10`, `01`, `2026` completes the date; `9`, `34`, `p` produces `09:34 PM` (`21:34`). `a` selects AM. Left/Right moves between segments, Up/Down adjusts the selected segment, Tab/Shift+Tab navigates normally, and Delete/Backspace can clear one segment while retaining the others.

Keyboard edits commit on **Enter, Tab, leaving the field, or Commit typed input**. Enter in the input does not submit the form. Intermediate year digits do not create committed checkpoints. Native picker confirmation and the 24-hour library's **Select time** confirmation use the same handler, and duplicate change/blur/Enter notifications do not emit duplicate `change` events. Escape dismisses a native popup using browser behavior; native date/time popup dismissal and retained focus were verified locally. In 24-hour mode, Escape closes the library popup, returns focus to the segment, and preserves pending edits without a checkpoint. Read-only prevents editing and programmatic picker opening.

Switching 24h mode restores the committed value in the selected input mode without changing it or emitting a checkpoint. Avoid toggling the display mode while an uncommitted edit is in progress.

The label remains across the top border when empty, focused, or filled. Required fields show a small `*`. Native calendar/clock indicators remain visible in the verified browser's empty and complete states.

## Existing value contract

| Mode | Native DOM value | Component committed value |
| --- | --- | --- |
| Date | `2026-10-01` | `2026-10-01` |
| Time | `21:34` | `21:34:00` |
| Deliberately cleared | `""` | `null` |

The time adapter preserves CIT's existing **`HH:mm:00`** contract. Midnight commits `00:00:00`. Initial ISO values hydrate browser-local segments and remain the committed ISO string until edited. Hydration emits `initValueChange`, with no user `change` checkpoint. **Clear** silently resets the committed value and input; user clearing emits `change: null` when the value changes. **Reset text to committed value** discards pending edits for Cancel.

## Partial-input and Save / Submit guard

A native partial field can look nonempty while `.value` is `""`. Its `validity.badInput` distinguishes incomplete segments from a deliberately blank field. Do not infer clearing from `inputText === ""`, and do not save the previous committed value when a new edit is invalid.

Before reading values or recombining timestamps:

1. Await **Commit typed input** on each editable native control.
2. Stop Save/Submit when any returned state has `valid: false` or `hasUncommittedInput: true`.
3. Apply the host form's date/time pairing, requiredness, and ordering checks.
4. Continue the existing checkpoint queue, full-field synchronization, and request workflow.

**Get input state** and **Commit typed input** return `{ valid, text, value, hasUncommittedInput, incomplete }`. They inspect the current DOM, including Save clicked before blur or before an input event. Blank input is valid syntax for draft Save, even when the field is marked required; requiredness remains a final Submit rule. Draft Save buttons should invoke the guarded workflow rather than native form submission; the demo uses `type="button"` and `novalidate` for this distinction.

| Component variable | Meaning |
| --- | --- |
| `value` | Existing committed selection |
| `inputText` | Native serialized value, or the explicit 24-hour segment text; partial native segments may yield an empty string |
| `inputValid` | Latest edit syntax/constraint validity |
| `hasUncommittedInput` | A pending edit needs committing or correcting |

Use **On change** for committed checkpoints. **On input** reports editing/validity state and must not enqueue canonical timestamp checkpoints. Native popups have no standard open/close events; **On picker open / close** events apply to the library fallback and the forced 24-hour popup. In forced 24-hour mode, **Open Menu / Close Menu** control the library popup. In native mode, **Open Menu** uses `showPicker()` when browser permission and user activation allow it; users can always use the native indicator where supported. **Close Menu** blurs the native field; Escape remains browser-controlled.

Native dates use the configured min/max values. Allowed/disabled dates and weekdays are checked after entry/selection; native calendar cells cannot represent arbitrary library-specific restrictions. Native popups use browser styling.

## Flexible styling

Field styling remains editable and bindable in WeWeb, with responsive values, classes, and states. The CIT appearance is a configurable preset, not a fixed theme.

| Setting | CIT-style example |
| --- | --- |
| Font family / Font size | `Arial, sans-serif` / `12px` |
| Background / Text color | `#FFFFFF` / `#1A2C2B` |
| Border color / Radius / Input border width | `#D4DFDE` / `6px` / `1px` |
| Input minimum height | `40px` |
| Input shadow (CSS) | `0 1px 2px #253F3E0B` |
| Input focus color / Outline width / Offset | `#5C7574` / `2px` / `2px` |
| Label color / Font size / Background | `#4C6D6B` / `9px` / field background |
| Required marker color | `#966844` |
| Danger color / Error background | `#966844` / `#FFFAF7` |

The persistent label is associated with the input. Invalid fields use `aria-invalid` and an associated error description. Bind **Field error message** (`inputErrorMessage`) to host pair/order errors; it displays the explanatory message and applies the configurable error colors. Host workflows must enforce those pair/order rules separately.

## Arrival / Clear form contract

Arrival and Clear each use a date/time pair. When exactly one value is complete, display **“Choose both date and time to save this pair.”** Retain the half pair in the draft UI without saving it as a timestamp. A blank or half-complete pair may remain in a draft; a partially edited native field must be completed or deliberately cleared before Save reads it.

Completing a valid pair lets the host combine the calendar date and time in the browser's local timezone and convert it to a UTC ISO timestamp using its existing checkpoint queue. Time on scene stays `—` until both timestamps are complete, then shows a duration such as `1 hr 15 min`. Clear may equal or follow Arrival. An earlier Clear displays **“Clear must follow Arrival”** and must not autosave a timestamp. Overnight calls require the next-day Clear date.

The standalone demo implements these rules, error appearance, duration, draft Save, hydration, reset, and pending-edit cancellation with synthetic local values. [demo/pairContract.js](demo/pairContract.js) is a tested host-form example; it is not wired into CIT's live workflows. Preserve CIT's existing recombination and checkpoint queue during integration. See [integration notes](docs/integration.md).

## Development and evidence

Use Node.js 20.19 or newer.

```sh
npm ci
npm test
npm run build
npm run demo
```

The demo renders both pairs, a 24-hour toggle, persistent labels, read-only mode, and an alternate style. GitHub Actions checks tests and the WeWeb `wwobject` production build. October 1, 2026 local verification: **97 tests pass**, **30 native and 35 forced 24-hour Chromium replay checks pass**, and desktop/390px mobile layouts render correctly. See [actual verification evidence](docs/verification.md) for the build result and acceptance boundary.

This delivers the component source. The updated version still needs to be selected in WeWeb and replayed in the authenticated CIT form before calling the four-control integration accepted. Existing Xano request actions remain Jared's responsibility; application publication is separate.

## Provenance and rollback

Based on [weweb-assets/ww-input-date-time-picker at `1ec958b77b75b5d48a75fe3de3ab87bb972c4983`](https://github.com/weweb-assets/ww-input-date-time-picker/tree/1ec958b77b75b5d48a75fe3de3ab87bb972c4983). Vendored `src/vue-datepicker.js` and `src/main.css` remain unchanged at picker version 3.6.8. Upstream Git history is retained.

Disable **Allow typing** for the original library path, or select retained **v0.2.0** for native-only typing regardless of use24, or **v0.1.0** to restore the previous free-text typing version. Keep original element configurations and ID bindings until project acceptance passes. Private local CIT rollback snapshots and synthetic browser artifacts are excluded from this public repository.

The upstream CSS source-map warning and inherited build-tool npm audit advisories remain recorded maintenance items; no picker/tooling upgrades were made for this feature.
