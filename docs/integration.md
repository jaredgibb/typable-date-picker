# CIT integration contract and remaining acceptance

## Delivery boundary

This repository delivers the custom WeWeb component. The Forms test instance was enabled for the earlier typing version; the four production form controls, existing checkpoint workflows, Xano request actions, and published application were not replaced. v0.2.0 delivers native controls and configurable styling through GitHub. Component tests and the standalone browser replay do not establish authenticated CIT acceptance.

## Recorded baseline

The read-only baseline is CIT's September 30, 2026 local raw export, Forms page cache version 42. It is not a fresh authenticated editor inspection. The installed date/time picker base ID in that snapshot is `985570fc-b3c0-4566-8004-82ab3b30a11d`.

Its vendored picker JavaScript and CSS match upstream commit `1ec958b77b75b5d48a75fe3de3ab87bb972c4983` byte for byte. The wrapper and configuration match after stripping WeWeb editor-only blocks and normalizing whitespace.

| Control | Snapshot element ID | UI key | Canonical timestamp |
| --- | --- | --- | --- |
| Incident Arrival time | `3821b5e2-f06c-48cc-9235-2442696c60c5` | `arrival_time` | `dispatch_at` |
| Incident Clear time | `f0756c9d-7ec1-40a7-ab38-6026330005aa` | `clear_time` | `clear_at` |
| Co-Response Follow-up start time | `c9860042-2f0b-40cc-9fbd-2a25e3cd6aed` | `start_time` | `follow_up_started_at` |
| Co-Response Follow-up end time | `d7d1896c-fe4a-4088-ac94-778acbde286d` | `end_time` | `follow_up_ended_at` |

All four are single-value, 24-hour time controls without seconds; auto-apply is off, explicit confirmation is enabled, and visible format is `HH:mm`. Initial values use UI values with canonical ISO timestamp fallbacks. Changes call the existing **Checkpoint CIT Form Field** workflow with the respective UI key.

User selections produce `HH:mm:00`; initial ISO strings remain supported. CIT recombines the selected local calendar date and hours/minutes into an ISO timestamp. An incomplete date/time pair remains browser-local in draft flows; clearing produces `null`. The serialized checkpoint queue and full-field synchronization before Save/Submit must be preserved.

A private local snapshot of all four controls and their descendants was saved for rollback. It is ignored by Git and excluded from this public repository. Capture the current editor revision again before replacement and retain the original element configurations until acceptance passes.

## Integration sequence

1. Import this component into unpublished WeWeb. Build/select source version v0.2.0 in the dashboard and refresh the editor. Pilot Incident Arrival time with Single / Time / no seconds / Allow typing enabled. Native display follows the browser locale; the committed time still uses HH:mm:00. Set the label, dimensions, typography, and focus color to match the surrounding CIT fields.
2. Preserve the original initial-value formula and committed `change` checkpoint workflow. Do not checkpoint the raw `input` event.
3. Add the awaited **Commit typed input** and validation guard before Save/Submit's full-field synchronization. Block incomplete native segments (`valid: false`, including empty serialized text with `incomplete: true`) instead of consuming the previous committed time. Continue allowing incomplete draft date/time pairs under the existing form contract.
4. If replacement changes the element ID, update all direct references: hydration, reset, checkpoint mappings, Save/Submit synchronization, date/time recombination, duration/ordering checks, prefill, Cancel, Discard, and post-submit reset.
5. Verify Arrival time before applying the component to the other three controls. Keep all existing queue serialization and date/time recombination behavior.

Native field `inputText` contains the serialized value, not visible partial segments. Do not treat empty `inputText` as clearing without the fresh commit result. The original 24-hour/custom-format configuration remains relevant when Allow typing is off; native display may use AM/PM while native value is always 24-hour. Bind `inputErrorMessage` for explanatory pair/order errors and set Danger color/Error background to the host palette.

For rapid edits, await the component commit result and stop if it is invalid or still pending. Continue CIT's existing checkpoint queue and its established synchronization order; do not introduce a parallel persistence path. Keep overnight calculations, transient reversed-order autosave behavior, and final ordering validation in the host form.

Existing Xano request actions remain under Jared's ownership. Publication is a separate step.

## Host pair/draft acceptance contract

Arrival and Clear each keep a separate date/time pair. Exactly one complete value displays **“Choose both date and time to save this pair.”** Keep it in the UI/draft without producing a timestamp. Blank or half-complete pairs remain allowed in existing draft flows; partially edited native fields must be completed or cleared before synchronization. Final Submit still checks requiredness and completeness.

Valid complete pairs combine using the browser's local timezone and convert to UTC ISO through CIT's existing queue. Time on scene stays `—` until both timestamps are complete, then shows a duration. Clear may equal or follow Arrival. Earlier Clear displays **“Clear must follow Arrival”** and does not autosave its timestamp. Overnight calls require the next-day Clear date. Pair/ordering errors use the configurable warm brown border, pale peach background, and associated message.

The component supplies single-field validation and host error rendering. `demo/pairContract.js` and the Arrival/Clear harness demonstrate these rules with six pair tests and an actual native browser replay, without any backend requests. Continue using CIT's established date/time recombination and serialized queue; this demo does not install a second persistence path.

## Current unpublished editor evidence

Named environment: **CIT Project**, project `831c9c16-b71b-4d6f-9bbd-38e457a8118b`, Forms page `11217cf7-ef8b-4cec-b0f5-e276f3887bcc`. Test element `0130ec08-1ba0-4542-b357-a456ab1f2780` was read back with Time, Single, Allow typing on, seconds off, custom HH:mm format, and label Test time. The GitHub component source is external and must be refreshed through WeWeb's source-version workflow. This configuration readback does not verify native v0.2.0 runtime behavior.

v0.2.0 local evidence: 78 tests, a passing WeWeb build, and 30 headed Chromium assertions; see [verification.md](verification.md). The previous v0.1.0 source and private original-instance snapshot remain available for rollback. Keep original element IDs/configuration until authenticated acceptance passes.

## Acceptance evidence still required

Record the named unpublished environment, editor revision, user role, test input, expected result, and actual result for:

- Typing, picker selection, switching between the paths, and one checkpoint per committed change.
- Midnight, invalid input, partial input, clearing, read-only behavior, Enter/Tab/Escape, and moving focus through the picker.
- Date-first/time-first entry, incomplete draft pairs, overnight duration, and ordering validation.
- Rapid edits, autosave, Save before blur, draft resume, direct editing, Cancel, Discard, and successful Submit.
- Desktop/mobile layout and authenticated role access.

After the editor replay, update CIT's existing frontend notes, form/draft contract, acceptance criteria, and implementation-status pages with actual evidence. Until that replay passes, status is **component delivered; CIT integration and authenticated acceptance pending**.
