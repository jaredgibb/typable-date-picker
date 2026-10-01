# CIT integration contract and remaining acceptance

## Delivery boundary

This repository delivers the custom WeWeb component. No CIT editor elements, workflows, Xano request actions, or published application have been changed. Component tests and a standalone browser replay do not establish authenticated CIT acceptance.

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

1. Import this component into unpublished WeWeb. Pilot Incident Arrival time with Single / Time / 24-hour / no seconds / Allow typing enabled. Set the label, dimensions, typography, and focus color to match the surrounding CIT fields.
2. Preserve the original initial-value formula and committed `change` checkpoint workflow. Do not checkpoint the raw `input` event.
3. Add the awaited **Commit typed input** and validation guard before Save/Submit's full-field synchronization. Block invalid nonempty text instead of consuming the previous committed time. Continue allowing incomplete draft date/time pairs under the existing form contract.
4. If replacement changes the element ID, update all direct references: hydration, reset, checkpoint mappings, Save/Submit synchronization, date/time recombination, duration/ordering checks, prefill, Cancel, Discard, and post-submit reset.
5. Verify Arrival time before applying the component to the other three controls. Keep all existing queue serialization and date/time recombination behavior.

For rapid edits, await the component commit result and stop if it is invalid or still pending. Continue CIT's existing checkpoint queue and its established synchronization order; do not introduce a parallel persistence path. Keep overnight calculations, transient reversed-order autosave behavior, and final ordering validation in the host form.

Existing Xano request actions remain under Jared's ownership. Publication is a separate step.

## Acceptance evidence still required

Record the named unpublished environment, editor revision, user role, test input, expected result, and actual result for:

- Typing, picker selection, switching between the paths, and one checkpoint per committed change.
- Midnight, invalid input, partial input, clearing, read-only behavior, Enter/Tab/Escape, and moving focus through the picker.
- Date-first/time-first entry, incomplete draft pairs, overnight duration, and ordering validation.
- Rapid edits, autosave, Save before blur, draft resume, direct editing, Cancel, Discard, and successful Submit.
- Desktop/mobile layout and authenticated role access.

After the editor replay, update CIT's existing frontend notes, form/draft contract, acceptance criteria, and implementation-status pages with actual evidence. Until that replay passes, status is **component delivered; CIT integration and authenticated acceptance pending**.
