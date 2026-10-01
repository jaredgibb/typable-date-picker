# Component verification — October 1, 2026

Environment: local repository `jaredgibb/typable-date-picker`, macOS, Node.js 20.19.4. UI replay used an isolated Chromium browser at `http://127.0.0.1:5177/` with the standalone Vue/WeWeb host harness, synthetic times, and no backend requests.

## Automated checks

| Check | Actual result |
| --- | --- |
| Clean `npm ci` | Pass; lockfile installs reproducibly |
| `npm test` | 37 cases pass: 17 parsing/format cases and 20 component cases |
| Real picker integration | Component cases use the unchanged vendored picker; only WeWeb host components/services are stubbed |
| `npm run build` | Pass using the WeWeb CLI for a `wwobject` element |
| Vendored source preservation | No changes to `src/vue-datepicker.js` or `src/main.css` |

Component cases exercise default-off/unsupported modes, valid candidate retention, Enter/Tab/blur, Save before blur, invalid/partial text, null clearing, ISO hydration, reset, autosave echoes, rapid-edit cancellation, picker handoff, confirmation, Escape/focus, labels, and read-only controls.

## Rendered browser replay

| Operation | Actual result |
| --- | --- |
| Type `14:30`, Enter | Value/change `14:30:00`; one event; zero form submits |
| Type `25:30`, Save before blur | Blocked; text stays visible; previous committed value and event count preserved |
| Type `00:00`, Save before blur | Saved `00:00:00`; one additional event |
| Increment picker hours/minutes, Select time | Same input/value update to `01:01` / `01:01:00`; one additional event; focus returns to input |
| Tab through the component | Input → clock button → next field; normal focus advancement |
| Type partial `1`, Enter | Invalid text retained; no extra event or form submit |
| Pending `14:30`, open picker | Panel displays 14 / 30; opening produces no change event |
| Escape while picker open | Panel closes; input regains focus; pending text retained without checkpoint |
| Hydrate `2026-09-15T14:24:00.000Z` | Browser-local display `10:24`; no change checkpoint |
| Empty hydrated input, Save before blur | Saved `null`; one change event with `null` |
| Read-only toggle | Native input is read-only; clock button is disabled |
| Mobile 390 × 844 | Document width 390px; no horizontal overflow; input, clock, and Select time visible |
| Desktop 1280 × 900 | Input and picker render with matching theme typography/colors |

Screenshots and browser snapshots are retained locally under ignored `output/playwright/` and `.playwright-cli/` directories. They are synthetic component evidence, not CIT editor acceptance evidence.

The upstream development warnings for the teleport prop, `dpStyle`, and missing CSS source map are recorded in the README. The replay recorded zero browser console errors after the demo favicon fix. npm reports advisories in the inherited tooling dependency tree; dependency upgrades are separate maintenance work.

## Unverified project acceptance

No authenticated WeWeb import or CIT replay has been performed. Current editor parity, workflow-ID replacement, checkpoint persistence, draft resume, overnight/order validation, Cancel/Discard/Submit, and authenticated role access remain to be verified in the named unpublished project. See [integration.md](integration.md). No CIT or Xano writes or publication occurred.
