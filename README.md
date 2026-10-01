# Typable date / time picker for WeWeb

A maintained custom version of WeWeb's existing date/time picker. In supported time mode, users can type `14:30` or open the existing clock picker. Both paths update the same `value` and `change` event.

## Import into WeWeb

Import this public GitHub repository as a custom element:

[github.com/jaredgibb/typable-date-picker](https://github.com/jaredgibb/typable-date-picker)

In the WeWeb dashboard, add a source code pointing to this repository and branch **main**. Then open the editor and add **Typable date / time picker** from the Dev panel. The tested source is also tagged **v0.1.0**. See the [official development/import workflow](https://developer.weweb.io/development-process.html).

Set:

- Selection mode: **Single**
- Date mode: **Time**
- Use 24-hour format: **On**
- Enable seconds and inline/calendar-only mode: **Off**
- Allow typing: **On**
- Input label: the field's accessible label, for example **Arrival time**

**Allow typing defaults to off.** Date, datetime, range, multiple-value, 12-hour, seconds, and inline modes continue using the original trigger layout. The original picker panel and its library remain in place. Typing mode uses a native **Select time** button connected to the same confirmation handler.

## Interaction contract

| Action | Result |
| --- | --- |
| Type a complete `HH:mm` | Keep the text as an uncommitted candidate |
| Enter, Tab, or leave the field | Commit a valid candidate once |
| Type partial or invalid text | Keep it visible, mark invalid, preserve the committed value |
| Empty the field and commit | Clear through the library handler and commit `null` |
| Open the clock | Seed the picker with valid pending text |
| Select time in the picker | Update the same input, value, and `change` event |
| Escape in the picker | Close it and restore input focus |
| Read-only | Prevent typing and opening the picker |

Accepted text is exactly `00:00` through `23:59`. `25:30`, `14:75`, `1`, whitespace, and non-padded times are rejected without reinterpretation. Enter does not submit a surrounding form. Tab advances normally. Moving between the input and picker does not checkpoint a second time.

The visible text is `HH:mm`; committed user selections retain the existing library's **`HH:mm:00`** output. An initial ISO value is displayed using browser-local hours/minutes and remains the committed value until the user edits it. Hydration continues emitting `initValueChange`, not `change`.

## Save / Submit integration

Invalid text deliberately does not overwrite the committed value. A Save workflow that only reads `value` can therefore save an older time. Add this guard **before** reading values or recombining date/time pairs:

1. Run **Commit typed input** for each active typing control and await its result. This captures valid typing even when Save is clicked before blur.
2. Stop Save/Submit when any result has `valid: false` or `hasUncommittedInput: true`; show the existing form error and focus the affected field.
3. Continue the existing checkpoint queue, full-field synchronization, date/time recombination, and Save/Submit request.

`valid` describes time syntax, independently of the existing required/date-pair rules. Empty text is syntactically valid and commits `null`. Continue permitting incomplete date/time pairs in drafts where your current contract permits them. Keep final Submit ordering and completeness validation in the host form.

| Component variable | Meaning |
| --- | --- |
| `value` | Existing committed value |
| `inputText` | Visible text, including invalid or partial text |
| `inputValid` | Whether the visible input/candidate is valid |
| `hasUncommittedInput` | Whether an edit still needs committing |

**Get input state** returns `{ valid, text, value, hasUncommittedInput }`. **Commit typed input** resolves to the same object. **Reset text to committed value** discards pending text. The existing **Clear** action silently resets the value and input for hydration/reset workflows; clearing the input as a user emits `change` with `null` when the committed value changes.

Use **On change** for committed checkpoints. **On text input** exposes editing/validation state and should not enqueue committed checkpoints. **On picker open / close** are also available.

## Styling and accessibility

The input uses the existing theme typography, colors, and border radius, plus **Input minimum height** (default 40px) and **Input focus color**. It includes an associated visible or screen-reader label, an accessible clock-button name, an invalid state, native constraint validation, and keyboard focus styling. Match these settings to the host project's fields during integration.

## Development and verification

Use Node.js 20.19 or newer.

```sh
npm ci
npm test
npm run build
npm run demo
```

`npm run demo` opens a standalone Vue harness at the URL printed by Vite. `npm run serve -- --port=8080` serves the custom element for the WeWeb developer workflow. GitHub Actions checks a clean install, tests, and the WeWeb production build.

Verification on October 1, 2026:

- 37 unit/component cases pass, including the real vendored picker, strict parsing, midnight, clearing, ISO hydration, rapid edits, duplicate suppression, Save before blur, read-only, and keyboard interactions.
- The WeWeb custom-element build passes.
- A standalone Chromium replay verified typing and picker confirmation, invalid/partial text, Save before blur, keyboard focus, and a 390px mobile layout without horizontal overflow.

This is component verification. Import into an authenticated WeWeb project and the CIT form acceptance replay remain pending. See [CIT integration notes](docs/integration.md) for the recorded snapshot contract and acceptance work.

## Provenance and rollback

Based on [weweb-assets/ww-input-date-time-picker at `1ec958b77b75b5d48a75fe3de3ab87bb972c4983`](https://github.com/weweb-assets/ww-input-date-time-picker/tree/1ec958b77b75b5d48a75fe3de3ab87bb972c4983). The vendored `src/vue-datepicker.js` and `src/main.css` remain unchanged; the existing picker is version 3.6.8. Upstream Git history is retained.

Disable **Allow typing** to restore the original trigger path. Preserve the original project element/configuration and bindings until acceptance passes; replacing an element may change its ID. A local private CIT rollback snapshot is intentionally excluded from this public repository.

Upstream development warnings about its teleport prop, `dpStyle` attribute, and missing CSS source map remain. The inherited build-tool dependency tree also has npm audit advisories; broad tooling/library upgrades are separate maintenance work.
