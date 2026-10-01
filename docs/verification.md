# Component verification — October 1, 2026

## v0.2.1 — honor the 24-hour display setting

Same local macOS/Node environment, unpublished standalone Vue harness, synthetic values and no backend requests. With Allow typing enabled, `use24=true` now renders controlled hour/minute segments and uses the unchanged library's 24-hour popup. Native date controls and `use24=false` time controls retain the v0.2.0 path.

- `npm run build`: **passes** using the WeWeb `wwobject` production compiler.
- `npm test`: **97 cases pass** across five suites (48 wrapper cases, 24 native helpers, 17 retained time adapters, 6 pair examples, 2 segment helpers).
- Headed Chromium: **35 forced 24-hour assertions pass**, and all **30 native assertions pass again** after the change.
- Actual enforced display: typing `1430` produces `14:30`, and the popup shows hour/minute controls with no AM/PM selector. Enter and Save before blur commit `14:30:00` once.
- `25:30`, `14:75`, and a missing segment remain visible/invalid and block Save without overwriting the previous time. Configured brown border and peach background were confirmed through computed styles.
- Clearing both segments commits `null`; midnight commits `00:00:00`; arrows, Tab, Cancel, hydration, read-only, and switching modes preserve the expected contract.
- Pending `16:45` seeds the picker without a checkpoint; selecting `21:34` updates both segments and the same value/change event once. Confirmation restores segment focus. Escape restores focus and preserves the pending edit without committing it.
- Existing styles remain configurable: `52px` height, `16px` text, and `14px` radius were verified. Desktop and 390px mobile fields have no horizontal overflow; the 24-hour popup fits the mobile viewport.
- Vendored picker JavaScript/CSS remain unchanged. Its known development teleport/dpStyle warnings still occur on the library path; the replay completed with no browser errors.

Ignored local evidence: `output/playwright/time24-replay-result.txt`, `native-021-regression.txt`, `time24-popup.png`, `time24-desktop.png`, and `time24-mobile.png`. Component evidence does not establish authenticated CIT acceptance. Build and GitHub delivery results are reported with the release.

## CIT component source update

Named environment: **CIT Project / Forms / unpublished editor**, October 1, 2026. MCP inspection of **Incident Arrival Time** (`9cad6a23-4e6e-40ba-bbe0-f62d2d9dc8e1`) confirmed `use24=true`, Allow typing on, Single/Time, and seconds off. The element used the editable `cit-native-date-time-picker` copy, whose active package/source was still `0.2.0` and always rendered a native time input for typing. The separate GitHub import already contained `0.2.1`.

Updated the existing copy in place using the tested runtime from commit `20cf1a33d6a16dda6572ed78749a73e278ee814d`, retaining its package/tag identity. WeWeb's component build succeeded. The active source version `1c363b29-2b1d-487b-8e9a-c714e079ed4e` read back as package `0.2.1`, with all ten source files exactly matching the submitted bundle. The complete Arrival element configuration and its existing checkpoint workflow compared equal before/after. The vendored library/CSS and native/time adapters also matched the original copy. `npm test` was rerun: **97 tests pass**.

The original source and update evidence remain in ignored `.local/cit-native-original-2026-10-01.json` and `.local/cit-native-release-021-evidence.json`. The verification browser reached the authenticated WeWeb editor, but Forms redirected to the app's Login page; the existing Chrome tab connection timed out. This verifies source delivery/configuration preservation, not the rendered field or authenticated form behavior. Refresh/replay in an authenticated app session remains required. No Xano request changes or application publication occurred.

## v0.2.0 native segmented controls

Environment: local `jaredgibb/typable-date-picker`, macOS, Node.js 20.19.4, unpublished standalone harness at `http://127.0.0.1:5177/`. Headed Chromium replay used the browser's US display and America/Detroit local timezone, synthetic values, and no backend requests.

| Check | Actual result |
| --- | --- |
| `npm test` | Pass: 78 cases across four suites |
| Native value/validation helpers | 24 cases: canonical values, midnight, invalid ranges, partial versus blank, date constraints, leap dates, and custom-error recovery |
| Component integration | 31 cases: actual Vue wrapper/native inputs, unchanged library fallback, commit/Save/clear/hydration/echo/reset, keyboard handling, readonly, labels/styles/errors, deferred year changes, partial-event detection |
| Existing time adapters | 17 cases pass, preserving baseline parsing/format contracts |
| Example host pair contract | 6 cases: blank/half pairs, local-to-UTC combination, duration, equality, ordering, overnight date |
| `npm run build` | Pass: WeWeb CLI `wwobject` build |
| Vendored source | No changes to `src/vue-datepicker.js` or `src/main.css` |
| Whitespace diff check | Pass with the repository's existing CRLF configuration accounted for |

The DOM cannot serialize the browser's partial segment text. Component cases simulate native `badInput`; the headed browser replay independently verifies real partial segments and native popup behavior.

### Headed native-browser replay

Thirty assertions pass in the final `native-picker-final` session:

| Operation | Actual result |
| --- | --- |
| Date typing `10`, `01`, with year absent | Visible `10/01/yyyy`; native value empty; `badInput=true`; field invalid |
| Save while year absent | Blocked; visible segments retained; no clearing/checkpoint |
| Type year `2026` | Intermediate year digits stay pending; Enter commits `2026-10-01` once |
| Time typing `9` | Visible `09:-- --`, selected minute segment, automatic colon, invalid partial state |
| Type `34`, then `p` | Visible `09:34 PM`; native value `21:34`; no separator typing |
| Save before blur | Commits `21:34:00`; zero surrounding form submits |
| Native clock selection, ArrowDown/Right/Down, Enter | Same input/committed value changes to `22:35` / `22:35:00` |
| Escape in native time/calendar popup | Dismisses popup and retains the corresponding input focus |
| Backspace on one time segment | Other segments remain visible; native `badInput=true`; Save blocks without saving or clearing the old time |
| Cancel pending edits | Restores `22:35` without a user checkpoint |
| Tab within date, ArrowUp on day | Native segment navigation; day changes `01` → `02` and commits on Enter |
| Midnight | Native `00:00`; committed `00:00:00` |
| Deliberate full clearing | Commits `null` |
| Complete date with blank time, draft Save | Draft saves UI pair with no timestamp; specified pair error is displayed |
| Hydrate Arrival/Clear example | No user change event; duration `1 hr 15 min` |
| Earlier Clear | `Clear must follow Arrival`; Save blocked; no timestamp autosave |
| Equal Clear/Arrival | Allowed; duration `0 min` |
| Next-day Clear | Overnight `23:45` → `01:00` displays `1 hr 15 min` |
| Read-only | Keyboard edits leave the value unchanged |
| Alternate styling | Field height `52px`, text `16px`, radius `14px` verified through computed styles |
| Desktop | Persistent labels, required markers, native icons, selection highlight, field/error/popup styles render correctly |
| Mobile viewport 390 × 844 | Document client/scroll width both 390px; no horizontal overflow; vertically arranged pairs and visible icons |
| Browser console | Final session: zero errors and zero warnings |

Local ignored evidence: `output/playwright/native-replay-result.txt`, `native-partial-date.png`, `native-partial-time.png`, `native-time-popup.png`, `native-date-popup.png`, `native-order-error.png`, `native-complete-desktop.png`, `native-alternate-style.png`, and `native-mobile.png`. These are component harness evidence, not authenticated CIT acceptance.

Native popup testing used a fresh headed browser before viewport emulation; Chromium native popups were unreliable after desktop viewport emulation. Mobile checks verify responsive layout rather than an actual iOS/Android system picker. The original vendored CSS still produces its missing source-map warning in Vite/test tooling; the native browser session records no console warnings.

## Retained v0.1.0 baseline

The previous tag retains the original strict free-text implementation. Its 37 tests and WeWeb build passed, and the earlier standalone Chromium replay verified typing, the library Select time confirmation, invalid text, Save before blur, hydration, reset, read-only, Escape/focus, and mobile layout. Those earlier results do not establish native v0.2.0 behavior; the new evidence above does.

## Project acceptance boundary

The original Forms test instance `0130ec08-1ba0-4542-b357-a456ab1f2780` was enabled for single Time / Allow typing and read back in unpublished **CIT Project**. That configuration check is distinct from this new native version, which must be selected in WeWeb after the GitHub source update. No authenticated browser replay of v0.2.0 in CIT has been completed.

The four real time controls' workflow-ID replacement, serialized checkpoint persistence, draft resume, direct editing, Cancel/Discard/final Submit, desktop/mobile application layout, and role access still require named-project acceptance. No Xano request changes or application publication were made. See [integration.md](integration.md).
